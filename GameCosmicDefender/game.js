(function () {
  const W = 800;
  const H = 600;
  const HS_KEY = "cosmicDefenderHighScore";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const buffer = document.createElement("canvas");
  buffer.width = W;
  buffer.height = H;
  const bctx = buffer.getContext("2d");

  const titleUi = document.getElementById("title-ui");
  const gameoverUi = document.getElementById("gameover-ui");
  const bestTitleEl = document.getElementById("best-title");
  const goScoreEl = document.getElementById("go-score");
  const goBestEl = document.getElementById("go-best");
  const btnStart = document.getElementById("btn-start");
  const btnRestart = document.getElementById("btn-restart");

  let phase = "title";
  let attractTime = 0;

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

  let time = 0;
  let score = 0;
  let levelTracked = 1;
  let glitchRemain = 0;
  let bossNextScore = 1600;

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

  let audioCtx = null;
  let masterGain = null;
  let bgmOsc1 = null;
  let bgmOsc2 = null;

  function loadHigh() {
    const n = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    return Number.isFinite(n) ? n : 0;
  }

  function saveHigh(n) {
    localStorage.setItem(HS_KEY, String(Math.max(0, n | 0)));
  }

  function refreshTitleBest() {
    bestTitleEl.textContent = String(loadHigh());
  }

  function currentLevel() {
    return Math.min(99, Math.floor(score / 1000) + 1);
  }

  function getScrollSpeed() {
    if (phase === "title") {
      return 92 + Math.sin(attractTime * 0.85) * 18;
    }
    const lv = currentLevel();
    return Math.min(240, 86 + (lv - 1) * 14 + Math.min(time * 1.55, 95));
  }

  function alienSpawnBase() {
    const lv = currentLevel();
    return Math.max(0.32, 1.42 - lv * 0.09 - Math.min(time / 100, 0.55));
  }

  function groundMissileBase() {
    const lv = currentLevel();
    return Math.max(0.55, 2.15 - lv * 0.11 - Math.min(time / 85, 0.85));
  }

  function terrainYAt(screenX, t) {
    const scroll = t * getScrollSpeed();
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

  function initAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.11;
    masterGain.connect(audioCtx.destination);

    bgmOsc1 = audioCtx.createOscillator();
    bgmOsc1.type = "sine";
    bgmOsc1.frequency.value = 45;
    bgmOsc2 = audioCtx.createOscillator();
    bgmOsc2.type = "triangle";
    bgmOsc2.frequency.value = 90;

    const g1 = audioCtx.createGain();
    g1.gain.value = 0.55;
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.28;
    bgmOsc1.connect(g1);
    bgmOsc2.connect(g2);
    g1.connect(masterGain);
    g2.connect(masterGain);
    bgmOsc1.start();
    bgmOsc2.start();
  }

  function resumeAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function sfxTone(freq, dur, type, vol) {
    if (!audioCtx || !masterGain) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    const t0 = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function sfxLaser() {
    sfxTone(880, 0.06, "square", 0.09);
  }

  function sfxExplode() {
    sfxTone(120, 0.18, "sawtooth", 0.14);
    sfxTone(60, 0.22, "sine", 0.1);
  }

  function sfxLevel() {
    sfxTone(523, 0.12, "triangle", 0.11);
    setTimeout(() => sfxTone(784, 0.14, "triangle", 0.1), 70);
  }

  function sfxHitBoss() {
    sfxTone(200, 0.08, "square", 0.1);
  }

  function sfxGameOver() {
    sfxTone(90, 0.35, "sawtooth", 0.14);
    sfxTone(55, 0.45, "triangle", 0.12);
  }

  function syncLevelGlitch() {
    while (currentLevel() > levelTracked) {
      levelTracked++;
      glitchRemain = Math.max(glitchRemain, 0.68);
      sfxLevel();
    }
  }

  function spawnExplosion(x, y, count) {
    const n = count != null ? count : 22;
    const palette = ["#ff2d95", "#ff6b35", "#00fff0", "#e040fb", "#ffeb3b", "#76ff03"];
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
      boss: false,
      x: W + ALIEN_RADIUS + 8,
      y: margin + Math.random() * (maxY - margin),
      r: ALIEN_RADIUS,
      vx: -ALIEN_SPEED * (0.85 + Math.random() * 0.3),
      hp: 1,
      fireIn: ALIEN_FIRE_INTERVAL_MIN + Math.random() * (ALIEN_FIRE_INTERVAL_MAX - ALIEN_FIRE_INTERVAL_MIN),
    });
  }

  function spawnBoss() {
    const hp = 12 + Math.min(28, Math.floor(score / 2500) * 3);
    aliens.push({
      boss: true,
      x: W + 95,
      y: 70 + Math.random() * (H * 0.4),
      r: 58,
      vx: -46,
      hp,
      maxHp: hp,
      fireIn: 0.35,
    });
    sfxExplode();
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
      len: 24,
    });
    sfxLaser();
  }

  function alienTryFire(a) {
    if (a.boss) {
      const base = Math.atan2(player.y - a.y, player.x - a.x);
      const shots = 7;
      const sp = ALIEN_MISSILE_SPEED * 0.92;
      for (let i = 0; i < shots; i++) {
        const ang = base + (i - (shots - 1) / 2) * 0.2;
        alienMissiles.push({
          x: a.x,
          y: a.y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: MISSILE_HIT_R + 1,
        });
      }
      return;
    }
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

  function hasBoss() {
    return aliens.some((a) => a.boss);
  }

  function trySpawnBoss() {
    if (phase !== "play") return;
    if (hasBoss()) return;
    if (score < bossNextScore) return;
    spawnBoss();
    bossNextScore += 2600 + Math.floor(score * 0.08);
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
    if (phase !== "play") return;

    trySpawnBoss();

    laserCooldown = Math.max(0, laserCooldown - dt);
    if (keys.Space && laserCooldown <= 0) {
      fireLaser();
      laserCooldown = LASER_COOLDOWN;
    }

    alienSpawnAcc += dt;
    if (!hasBoss() && alienSpawnAcc >= nextAlienSpawn) {
      alienSpawnAcc = 0;
      nextAlienSpawn = alienSpawnBase() * (0.65 + Math.random() * 0.55);
      spawnAlien(time);
    }

    groundMissileAcc += dt;
    if (groundMissileAcc >= nextGroundMissile) {
      groundMissileAcc = 0;
      nextGroundMissile = groundMissileBase() * (0.75 + Math.random() * 0.65);
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
        a.fireIn = a.boss ? 0.42 + Math.random() * 0.28 : ALIEN_FIRE_INTERVAL_MIN + Math.random() * (ALIEN_FIRE_INTERVAL_MAX - ALIEN_FIRE_INTERVAL_MIN);
      }
      if (a.x < -a.r - 40) aliens.splice(i, 1);
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
        if (dist2(lx, ly, a.x, a.y) <= (a.r + 5) * (a.r + 5)) {
          if (a.boss && a.hp > 1) {
            a.hp--;
            lasers.splice(li, 1);
            spawnExplosion(a.x, a.y, 10);
            sfxHitBoss();
            break;
          }
          spawnExplosion(a.x, a.y, a.boss ? 40 : 22);
          if (a.boss) score += 900;
          else score += 100;
          aliens.splice(ai, 1);
          lasers.splice(li, 1);
          sfxExplode();
          syncLevelGlitch();
          break;
        }
      }
    }

    for (const a of aliens) {
      if (playerHitCircle(a.x, a.y, a.r)) {
        triggerGameOver();
        return;
      }
    }
    for (const m of alienMissiles) {
      if (playerHitCircle(m.x, m.y, m.r)) {
        triggerGameOver();
        return;
      }
    }
    for (const m of groundMissiles) {
      if (playerHitCircle(m.x, m.y, m.r)) {
        triggerGameOver();
        return;
      }
    }
  }

  function triggerGameOver() {
    if (phase !== "play") return;
    phase = "over";
    spawnExplosion(player.x, player.y, 30);
    const prev = loadHigh();
    const next = Math.max(prev, score);
    saveHigh(next);
    goScoreEl.textContent = String(score);
    goBestEl.textContent = String(next);
    gameoverUi.classList.remove("hidden");
    sfxGameOver();
  }

  function drawGrid(c, t) {
    const gridSize = 40;
    const offset = (t * 48) % gridSize;
    c.strokeStyle = "rgba(0, 255, 240, 0.32)";
    c.lineWidth = 1;
    c.beginPath();
    for (let x = -gridSize + offset; x < W + gridSize; x += gridSize) {
      c.moveTo(x, 0);
      c.lineTo(x, H);
    }
    const horizon = H * 0.42;
    for (let y = horizon; y < H + gridSize; y += gridSize) {
      c.moveTo(0, y);
      c.lineTo(W, y);
    }
    c.stroke();

    c.strokeStyle = "rgba(255, 45, 200, 0.12)";
    c.beginPath();
    const vanishX = W * 0.5;
    const vanishY = horizon - 20;
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const ang = (-0.35 + (i / (rays - 1)) * 0.7) * Math.PI;
      const len = H * 1.2;
      c.moveTo(vanishX, vanishY);
      c.lineTo(vanishX + Math.cos(ang) * len, vanishY + Math.sin(ang) * len);
    }
    c.stroke();
  }

  function drawSun(c) {
    const gx = W * 0.72;
    const gy = H * 0.22;
    const grd = c.createLinearGradient(gx, gy - 55, gx, gy + 55);
    grd.addColorStop(0, "#ff9100");
    grd.addColorStop(0.35, "#ff2d95");
    grd.addColorStop(0.7, "#d500f9");
    grd.addColorStop(1, "#120018");
    c.fillStyle = grd;
    c.beginPath();
    c.arc(gx, gy, 52, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(255, 235, 120, 0.75)";
    c.lineWidth = 3;
    c.shadowColor = "#ff00aa";
    c.shadowBlur = 22;
    c.stroke();
    c.shadowBlur = 0;
    const sliceH = 6;
    c.fillStyle = "#050208";
    for (let y = gy + 10; y < gy + 56; y += sliceH * 2) {
      c.fillRect(gx - 56, y, 112, sliceH);
    }
  }

  function drawTerrain(c, t) {
    c.beginPath();
    c.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
      c.lineTo(x, terrainYAt(x, t));
    }
    c.lineTo(W, H);
    c.closePath();
    const g = c.createLinearGradient(0, terrain.baseY - 60, 0, H);
    g.addColorStop(0, "rgba(213, 0, 249, 0.98)");
    g.addColorStop(0.5, "rgba(176, 38, 255, 0.95)");
    g.addColorStop(1, "rgba(25, 5, 55, 0.99)");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "#ff6bff";
    c.lineWidth = 3;
    c.shadowColor = "#ff00f5";
    c.shadowBlur = 20;
    c.stroke();
    c.shadowBlur = 0;
  }

  function drawLasers(c) {
    for (const L of lasers) {
      c.strokeStyle = "#00fff0";
      c.shadowColor = "#00fff0";
      c.shadowBlur = 18;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(L.x - L.len, L.y);
      c.lineTo(L.x, L.y);
      c.stroke();
      c.shadowBlur = 0;
    }
  }

  function drawAliens(c) {
    for (const a of aliens) {
      if (a.boss) {
        c.strokeStyle = "rgba(255, 145, 0, 0.95)";
        c.lineWidth = 5;
        c.shadowColor = "#ff9100";
        c.shadowBlur = 28;
        c.beginPath();
        c.arc(a.x, a.y, a.r + 10, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
        const ratio = a.hp / (a.maxHp || a.hp);
        c.fillStyle = "rgba(0,0,0,0.45)";
        c.fillRect(a.x - 50, a.y - a.r - 22, 100, 8);
        c.fillStyle = "#00fff0";
        c.shadowColor = "#00fff0";
        c.shadowBlur = 8;
        c.fillRect(a.x - 50, a.y - a.r - 22, 100 * ratio, 8);
        c.shadowBlur = 0;
      }
      c.shadowColor = a.boss ? "#ff1744" : "#ff1744";
      c.shadowBlur = a.boss ? 26 : 18;
      c.fillStyle = a.boss ? "#ff5252" : "#ff1744";
      c.strokeStyle = a.boss ? "#ffecb3" : "#ff8a80";
      c.lineWidth = a.boss ? 3 : 2;
      c.beginPath();
      c.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;
    }
  }

  function drawAlienMissiles(c) {
    for (const m of alienMissiles) {
      c.fillStyle = "#ff4081";
      c.shadowColor = "#ff4081";
      c.shadowBlur = 12;
      c.beginPath();
      c.arc(m.x, m.y, 5, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }
  }

  function drawGroundMissiles(c) {
    for (const m of groundMissiles) {
      c.fillStyle = "#ffea00";
      c.shadowColor = "#fff59d";
      c.shadowBlur = 14;
      c.beginPath();
      c.moveTo(m.x, m.y - 8);
      c.lineTo(m.x - 4, m.y + 4);
      c.lineTo(m.x + 4, m.y + 4);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
    }
  }

  function drawParticles(c) {
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      c.globalAlpha = a;
      c.fillStyle = p.color;
      c.shadowColor = p.color;
      c.shadowBlur = 10;
      c.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
  }

  function drawPlayer(c) {
    const tri = shipTriangle();
    c.shadowColor = "#ff2d95";
    c.shadowBlur = 26;
    c.fillStyle = "#ff2d95";
    c.strokeStyle = "#ffe0ff";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(tri.ax, tri.ay);
    c.lineTo(tri.bx, tri.by);
    c.lineTo(tri.cx, tri.cy);
    c.closePath();
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
  }

  function drawSceneToBuffer(tDraw) {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.fillStyle = "#050208";
    bctx.fillRect(0, 0, W, H);
    drawGrid(bctx, tDraw);
    drawSun(bctx);
    drawTerrain(bctx, tDraw);

    if (phase !== "title") {
      drawLasers(bctx);
      drawAliens(bctx);
      drawAlienMissiles(bctx);
      drawGroundMissiles(bctx);
      drawPlayer(bctx);
    }

    drawParticles(bctx);
  }

  function drawGlitchOverlay(dest, src, strength) {
    if (strength <= 0.02) return;
    const rows = 18;
    const rh = H / rows;
    dest.save();
    for (let i = 0; i < rows; i++) {
      const y = i * rh;
      const h = rh + 2;
      const jx = (Math.sin(performance.now() * 0.03 + i * 1.7) + (Math.random() - 0.5)) * 20 * strength;
      dest.drawImage(src, 0, y, W, h, jx, y, W, h);
    }
    if (Math.random() < 0.45 * strength) {
      dest.globalCompositeOperation = "screen";
      dest.fillStyle = Math.random() < 0.5 ? "rgba(255, 0, 160, 0.18)" : "rgba(0, 255, 240, 0.14)";
      dest.fillRect(0, 0, W, H);
    }
    dest.restore();
    dest.globalCompositeOperation = "source-over";
  }

  function drawNoise(dest) {
    for (let i = 0; i < 140; i++) {
      dest.fillStyle = `rgba(255,255,255,${Math.random() * 0.045})`;
      dest.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2);
    }
    for (let i = 0; i < 30; i++) {
      dest.fillStyle = `rgba(255, 45, 200,${Math.random() * 0.06})`;
      dest.fillRect(Math.random() * W, Math.random() * H, 2, 1);
    }
  }

  function drawScanlines(dest) {
    dest.save();
    for (let y = 0; y < H; y += 2) {
      dest.fillStyle = "rgba(0, 0, 0, 0.11)";
      dest.fillRect(0, y, W, 1);
    }
    for (let y = 1; y < H; y += 4) {
      dest.fillStyle = "rgba(255, 255, 255, 0.02)";
      dest.fillRect(0, y, W, 1);
    }
    dest.restore();
  }

  function drawBloomPass() {
    ctx.save();
    ctx.filter = "blur(9px)";
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.42;
    ctx.drawImage(buffer, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.filter = "none";
  }

  function drawHud() {
    ctx.font = 'bold 20px "Segoe UI", "Malgun Gothic", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#00fff0";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#00fff0";
    const lv = phase === "play" || phase === "over" ? currentLevel() : 1;
    ctx.fillText(`SCORE ${score}`, 14, 12);
    ctx.fillText(`LEVEL ${lv}`, 14, 36);
    ctx.shadowBlur = 0;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255, 200, 255, 0.85)";
    ctx.fillText(`BEST ${loadHigh()}`, 14, 62);
  }

  function drawTitleCanvas() {
    ctx.save();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff2d95";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ff2d95";
    ctx.fillText("COSMIC DEFENDER", W / 2, H * 0.38);
    ctx.shadowBlur = 0;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillStyle = "#00fff0";
    ctx.shadowBlur = 10;
    ctx.fillText("NEON OUTRUN PROTOCOL", W / 2, H * 0.44);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawVignette(dest) {
    const rg = dest.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.88);
    rg.addColorStop(0, "rgba(0,0,0,0)");
    rg.addColorStop(1, "rgba(0,0,0,0.62)");
    dest.fillStyle = rg;
    dest.fillRect(0, 0, W, H);
  }

  function drawFrame() {
    const tDraw = phase === "title" ? attractTime : time;

    drawSceneToBuffer(tDraw);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#030108";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(buffer, 0, 0);
    drawBloomPass();

    if (glitchRemain > 0) {
      const g = Math.min(1, glitchRemain / 0.68);
      drawGlitchOverlay(ctx, buffer, g);
    }

    drawNoise(ctx);
    drawScanlines(ctx);

    if (phase === "title") drawTitleCanvas();
    if (phase === "play" || phase === "over") drawHud();

    drawVignette(ctx);
  }

  function resetWorld() {
    player.x = 120;
    player.y = H / 2;
    time = 0;
    score = 0;
    levelTracked = 1;
    glitchRemain = 0;
    bossNextScore = 1600;
    lasers.length = 0;
    aliens.length = 0;
    alienMissiles.length = 0;
    groundMissiles.length = 0;
    particles.length = 0;
    laserCooldown = 0;
    alienSpawnAcc = 0;
    groundMissileAcc = 0;
    nextAlienSpawn = 0.85;
    nextGroundMissile = 1.4;
  }

  function beginPlay() {
    resumeAudio();
    phase = "play";
    resetWorld();
    titleUi.classList.add("hidden");
    gameoverUi.classList.add("hidden");
  }

  function restartFromGameOver() {
    resumeAudio();
    phase = "play";
    resetWorld();
    gameoverUi.classList.add("hidden");
  }

  function update(dt) {
    updateParticles(dt);

    if (glitchRemain > 0) glitchRemain -= dt;

    if (phase === "title") {
      attractTime += dt;
      return;
    }

    if (phase === "over") {
      return;
    }

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

    if (phase === "play" && shipHitsTerrain(time)) {
      triggerGameOver();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    drawFrame();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyR" && phase === "over") {
      restartFromGameOver();
      e.preventDefault();
      return;
    }
    if (e.code === "Space") {
      keys.Space = true;
      if (phase === "title") {
        e.preventDefault();
        return;
      }
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

  btnStart.addEventListener("click", () => beginPlay());
  btnRestart.addEventListener("click", () => restartFromGameOver());

  refreshTitleBest();
  requestAnimationFrame(frame);
})();
