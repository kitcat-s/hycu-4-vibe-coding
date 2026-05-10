(function () {
  const W = 800;
  const H = 600;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

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

  const terrain = {
    baseY: H - 80,
    amplitude: 42,
    frequency: 0.018,
    phaseSpeed: 1.2,
    scrollSpeed: 90,
  };

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
  }

  function update(dt) {
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

    if (shipHitsTerrain(time)) gameOver = true;
  }

  function draw() {
    ctx.fillStyle = "#050208";
    ctx.fillRect(0, 0, W, H);
    drawGrid(time);
    drawSun();
    drawTerrain(time);
    drawPlayer();
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
    if (setArrowKey(e.code, true)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    if (setArrowKey(e.code, false)) e.preventDefault();
  });

  requestAnimationFrame(frame);
})();
