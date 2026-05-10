(function () {
  const W = 800;
  const H = 600;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  };

  function setArrowKey(code, down) {
    if (code === "ArrowUp") keys.ArrowUp = down;
    else if (code === "ArrowDown") keys.ArrowDown = down;
    else if (code === "ArrowLeft") keys.ArrowLeft = down;
    else if (code === "ArrowRight") keys.ArrowRight = down;
    else return false;
    return true;
  }

  const player = {
    x: 120,
    y: H / 2,
    vx: 0,
    vy: 0,
    speed: 280,
    size: 18,
  };

  let gameOver = false;
  let time = 0;
  let score = 0;

  const lasers = [];
  const aliens = [];
  const alienMissiles = [];
  const groundMissiles = [];
  const particles = [];

  let laserCooldown = 0;
  let alienSpawnAcc = 0;
  let groundMissileAcc = 0;
  let nextAlienSpawn = 1.2;
  let nextGroundMissile = 2.0;

  const terrain = {
    baseY: H - 80,
    amplitude: 42,
    frequency: 0.018,
    phaseSpeed: 1.2,
    scrollSpeed: 90,
  };

  const LASER_SPEED = 720;
  const LASER_COOLDOWN = 0.14;
  const ALIEN_SPEED = 110;
  const ALIEN_RADIUS = 18;
  const ALIEN_FIRE_INTERVAL_MIN = 0.8;
  const ALIEN_FIRE_INTERVAL_MAX = 2.4;
  const ALIEN_MISSILE_SPEED = 260;
  const GROUND_MISSILE_SPEED = 320;
  const PLAYER_HIT_R = 16;
  const MISSILE_HIT_R = 6;

  function terrainYAt(screenX, t) {
    const scroll = t * terrain.scrollSpeed;
    const x = screenX + scroll;
    return (
      terrain.baseY +
      Math.sin(x * terrain.frequency + t * terrain.phaseSpeed) * terrain.amplitude +
      Math.sin(x * terrain.frequency * 0.5 + t * 0.7) * (terrain.amplitude * 0.35)
    );
  }

  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const sign = (p1x, p1y, p2x, p2y, p3x, p3y) =>
      (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
    const d1 = sign(px, py, ax, ay, bx, by);
    const d2 = sign(px, py, bx, by, cx, cy);
    const d3 = sign(px, py, cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }

  function shipTriangle() {
    const s = player.size;
    const cx = player.x;
    const cy = player.y;
    return {
      ax: cx + s,
      ay: cy,
      bx: cx - s * 0.85,
      by: cy - s * 0.65,
      cx: cx - s * 0.85,
      cy: cy + s * 0.65,
    };
  }

  function shipHitsTerrain(t) {
    const tri = shipTriangle();
    const step = 3;
    for (let sx = Math.max(0, tri.bx - 4); sx <= Math.min(W, tri.ax + 4); sx += step) {
      const top = terrainYAt(sx, t);
      for (let sy = Math.floor(tri.by - 2); sy <= Math.ceil(tri.cy + 2); sy += step) {
        if (sy >= top && pointInTriangle(sx, sy, tri.ax, tri.ay, tri.bx, tri.by, tri.cx, tri.cy)) {
          return true;
        }
      }
    }
    return false;
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function playerHitCircle(px, py, pr) {
    return dist2(player.x, player.y, px, py) <= (PLAYER_HIT_R + pr) * (PLAYER_HIT_R + pr);
  }

  function spawnExplosion(x, y) {
    const n = 22;
    const palette = ["#ff2d95", "#ff6b35", "#00f5d4", "#e040fb", "#ffeb3b"];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.8;
      const sp = 80 + Math.random() * 180;
      const life0 = 0.45 + Math.random() * 0.35;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: life0,
        maxLife: life0,
        color: palette[(Math.random() * palette.length) | 0],
        size: 2 + Math.random() * 3,
      });
    }
  }

  function spawnAlien(t) {
    const margin = 50;
    const maxY = H * 0.52;
    aliens.push({
      x: W + ALIEN_RADIUS + 8,
      y: margin + Math.random() * (maxY - margin),
      r: ALIEN_RADIUS,
      vx: -ALIEN_SPEED * (0.85 + Math.random() * 0.3),
      fireIn: ALIEN_FIRE_INTERVAL_MIN + Math.random() * (ALIEN_FIRE_INTERVAL_MAX - ALIEN_FIRE_INTERVAL_MIN),
    });
  }

  function spawnGroundMissile(t) {
    const gx = 40 + Math.random() * (W - 80);
    const surface = terrainYAt(gx, t);
    groundMissiles.push({
      x: gx,
      y: surface - 6,
      vy: -GROUND_MISSILE_SPEED,
      r: MISSILE_HIT_R,
    });
  }

  function fireLaser() {
    const tri = shipTriangle();
    lasers.push({
      x: tri.ax + 6,
      y: tri.ay,
      vx: LASER_SPEED,
      vy: 0,
      len: 22,
    });
  }

  function alienTryFire(a) {
    const dx = player.x - a.x;
    const dy = player.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = ALIEN_MISSILE_SPEED;
    alienMissiles.push({
      x: a.x,
      y: a.y,
      vx: (dx / len) * sp,
      vy: (dy / len) * sp,
      r: MISSILE_HIT_R,
    });
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateCombat(dt) {
    laserCooldown = Math.max(0, laserCooldown - dt);
    if (keys.Space && laserCooldown <= 0) {
      fireLaser();
      laserCooldown = LASER_COOLDOWN;
    }

    alienSpawnAcc += dt;
    if (alienSpawnAcc >= nextAlienSpawn) {
      alienSpawnAcc = 0;
      nextAlienSpawn = 0.7 + Math.random() * 1.4;
      spawnAlien(time);
    }

    groundMissileAcc += dt;
    if (groundMissileAcc >= nextGroundMissile) {
      groundMissileAcc = 0;
      nextGroundMissile = 1.2 + Math.random() * 2.2;
      spawnGroundMissile(time);
    }

    for (let i = lasers.length - 1; i >= 0; i--) {
      const L = lasers[i];
      L.x += L.vx * dt;
      L.y += L.vy * dt;
      if (L.x > W + 40) lasers.splice(i, 1);
    }

    for (let i = aliens.length - 1; i >= 0; i--) {
      const a = aliens[i];
      a.x += a.vx * dt;
      a.fireIn -= dt;
      if (a.fireIn <= 0) {
        alienTryFire(a);
        a.fireIn = ALIEN_FIRE_INTERVAL_MIN + Math.random() * (ALIEN_FIRE_INTERVAL_MAX - ALIEN_FIRE_INTERVAL_MIN);
      }
      if (a.x < -a.r - 20) aliens.splice(i, 1);
    }

    for (let i = alienMissiles.length - 1; i >= 0; i--) {
      const m = alienMissiles[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < -40 || m.x > W + 40 || m.y < -40 || m.y > H + 40) alienMissiles.splice(i, 1);
    }

    for (let i = groundMissiles.length - 1; i >= 0; i--) {
      const m = groundMissiles[i];
      m.y += m.vy * dt;
      if (m.y < -30) groundMissiles.splice(i, 1);
    }

    for (let li = lasers.length - 1; li >= 0; li--) {
      const L = lasers[li];
      const lx = L.x;
      const ly = L.y;
      for (let ai = aliens.length - 1; ai >= 0; ai--) {
        const a = aliens[ai];
        if (dist2(lx, ly, a.x, a.y) <= (a.r + 4) * (a.r + 4)) {
          spawnExplosion(a.x, a.y);
          aliens.splice(ai, 1);
          lasers.splice(li, 1);
          score += 100;
          break;
        }
      }
    }

    for (const a of aliens) {
      if (playerHitCircle(a.x, a.y, a.r)) {
        gameOver = true;
        spawnExplosion(player.x, player.y);
        return;
      }
    }
    for (const m of alienMissiles) {
      if (playerHitCircle(m.x, m.y, m.r)) {
        gameOver = true;
        spawnExplosion(player.x, player.y);
        return;
      }
    }
    for (const m of groundMissiles) {
      if (playerHitCircle(m.x, m.y, m.r)) {
        gameOver = true;
        spawnExplosion(player.x, player.y);
        return;
      }
    }
  }

  function drawGrid(t) {
    const gridSize = 40;
    const offset = (t * 45) % gridSize;
    ctx.strokeStyle = "rgba(0, 245, 212, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -gridSize + offset; x < W + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    const horizon = H * 0.42;
    for (let y = horizon; y < H + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 245, 212, 0.08)";
    ctx.beginPath();
    const vanishX = W * 0.5;
    const vanishY = horizon - 20;
    const rays = 14;
    for (let i = 0; i < rays; i++) {
      const ang = (-0.35 + (i / (rays - 1)) * 0.7) * Math.PI;
      const len = H * 1.2;
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(vanishX + Math.cos(ang) * len, vanishY + Math.sin(ang) * len);
    }
    ctx.stroke();
  }

  function drawSun() {
    const gx = W * 0.72;
    const gy = H * 0.22;
    const grd = ctx.createLinearGradient(gx, gy - 50, gx, gy + 50);
    grd.addColorStop(0, "#ff6b35");
    grd.addColorStop(0.45, "#ff2d95");
    grd.addColorStop(1, "#2d0a3d");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(gx, gy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 45, 149, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const sliceH = 6;
    ctx.fillStyle = "#050208";
    for (let y = gy + 8; y < gy + 52; y += sliceH * 2) {
      ctx.fillRect(gx - 52, y, 104, sliceH);
    }
  }

  function drawTerrain(t) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
      ctx.lineTo(x, terrainYAt(x, t));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, terrain.baseY - 60, 0, H);
    g.addColorStop(0, "rgba(176, 38, 255, 0.95)");
    g.addColorStop(1, "rgba(45, 10, 80, 0.98)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#e040fb";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#b026ff";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawLasers() {
    for (const L of lasers) {
      ctx.strokeStyle = "#00f5d4";
      ctx.shadowColor = "#00f5d4";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(L.x - L.len, L.y);
      ctx.lineTo(L.x, L.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawAliens() {
    for (const a of aliens) {
      ctx.shadowColor = "#ff1744";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#ff1744";
      ctx.strokeStyle = "#ff8a80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawAlienMissiles() {
    for (const m of alienMissiles) {
      ctx.fillStyle = "#ff5252";
      ctx.shadowColor = "#ff5252";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawGroundMissiles() {
    for (const m of groundMissiles) {
      ctx.fillStyle = "#ffeb3b";
      ctx.shadowColor = "#fff59d";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - 8);
      ctx.lineTo(m.x - 4, m.y + 4);
      ctx.lineTo(m.x + 4, m.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  function drawPlayer() {
    const tri = shipTriangle();
    ctx.shadowColor = "#ff2d95";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ff2d95";
    ctx.strokeStyle = "#ffb7e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tri.ax, tri.ay);
    ctx.lineTo(tri.bx, tri.by);
    ctx.lineTo(tri.cx, tri.cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawScore() {
    ctx.font = 'bold 20px "Segoe UI", "Malgun Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#00f5d4";
    ctx.fillText(`SCORE ${score}`, 14, 12);
    ctx.shadowBlur = 0;
  }

  function drawScanlines() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  function drawVignette() {
    const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
    rg.addColorStop(0, "rgba(0,0,0,0)");
    rg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(10, 5, 20, 0.72)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff2d95";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ff2d95";
    ctx.fillText("GAME OVER", W / 2, H / 2 - 18);
    ctx.shadowBlur = 0;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = "#00f5d4";
    ctx.fillText("R 키로 다시 시작", W / 2, H / 2 + 28);
  }

  function reset() {
    gameOver = false;
    player.x = 120;
    player.y = H / 2;
    time = 0;
    score = 0;
    lasers.length = 0;
    aliens.length = 0;
    alienMissiles.length = 0;
    groundMissiles.length = 0;
    particles.length = 0;
    laserCooldown = 0;
    alienSpawnAcc = 0;
    groundMissileAcc = 0;
    nextAlienSpawn = 0.8;
    nextGroundMissile = 1.5;
  }

  function update(dt) {
    updateParticles(dt);
    if (gameOver) return;
    time += dt;
    let dx = 0;
    let dy = 0;
    if (keys.ArrowLeft) dx -= 1;
    if (keys.ArrowRight) dx += 1;
    if (keys.ArrowUp) dy -= 1;
    if (keys.ArrowDown) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
    }
    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
    const pad = player.size + 4;
    player.x = Math.min(W - pad, Math.max(pad, player.x));
    player.y = Math.min(H - pad - 20, Math.max(pad + 40, player.y));

    updateCombat(dt);

    if (!gameOver && shipHitsTerrain(time)) gameOver = true;
  }

  function draw() {
    ctx.fillStyle = "#050208";
    ctx.fillRect(0, 0, W, H);
    drawGrid(time);
    drawSun();
    drawTerrain(time);
    drawLasers();
    drawAliens();
    drawAlienMissiles();
    drawGroundMissiles();
    drawPlayer();
    drawParticles();
    drawScore();
    drawScanlines();
    drawVignette();
    if (gameOver) drawGameOver();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyR" && gameOver) {
      reset();
      e.preventDefault();
      return;
    }
    if (e.code === "Space") {
      keys.Space = true;
      e.preventDefault();
      return;
    }
    if (setArrowKey(e.code, true)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      keys.Space = false;
      e.preventDefault();
      return;
    }
    if (setArrowKey(e.code, false)) e.preventDefault();
  });

  window.addEventListener("blur", () => {
    keys.ArrowUp = keys.ArrowDown = keys.ArrowLeft = keys.ArrowRight = keys.Space = false;
  });

  requestAnimationFrame(frame);
})();
