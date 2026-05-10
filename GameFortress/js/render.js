(function () {
  const GF = window.GF;

  GF.getCannonPositions = () => {
    const { WIDTH } = GF.config;
    const leftX = 56;
    const rightX = WIDTH - 56;
    const leftY = GF.state.terrain[leftX];
    const rightY = GF.state.terrain[rightX];
    return [
      { x: leftX, y: leftY },
      { x: rightX, y: rightY },
    ];
  };

  GF.getAimForTurn = () => {
    const shooter = GF.getCannonPositions()[GF.state.turn];
    const muzzleY = shooter.y - 16;
    const dx = GF.state.mouse.x - shooter.x;
    const dy = GF.state.mouse.y - muzzleY;
    const angle = Math.atan2(dy, dx);
    const powerRaw = Math.hypot(dx, dy);
    const power = GF.clamp(powerRaw * 1.8, 120, 540);
    return { shooter, angle, power };
  };

  GF.drawUi = () => {
    const { WIDTH, UI_HEIGHT, TURN_NAMES, MAX_HP } = GF.config;
    const { ctx, state } = GF;
    const pl = state.players[state.turn];
    const wn = GF.WEAPONS.normal;
    const wh = GF.WEAPONS.heavy;
    const wc = GF.WEAPONS.cluster;

    ctx.fillStyle = "#121737";
    ctx.fillRect(0, 0, WIDTH, UI_HEIGHT);

    ctx.strokeStyle = "#7ea0ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, WIDTH - 4, UI_HEIGHT - 4);

    ctx.fillStyle = "#e4ecff";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`TURN: ${TURN_NAMES[state.turn]}`, 14, 26);

    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = "#c8d8ff";
    const p0 = state.players[0];
    const p1 = state.players[1];
    ctx.fillText(`P1 HP ${p0.hp}/${MAX_HP}`, 200, 26);
    ctx.fillText(`P2 HP ${p1.hp}/${MAX_HP}`, 360, 26);

    ctx.fillStyle = "#9ec0ff";
    ctx.textAlign = "right";
    const windArrow = state.wind < 0 ? "<" : ">";
    ctx.fillText(`WIND: ${windArrow} ${Math.abs(state.wind)}`, WIDTH - 14, 26);
    ctx.textAlign = "left";

    ctx.font = "14px 'Courier New', monospace";
    const rowWeapon = (x0, key, label, count, id) => {
      const on = pl.selectedWeapon === id;
      ctx.fillStyle = on ? "#ffd56b" : "#9ec0ff";
      ctx.fillText(`${key}:${label}(${count})`, x0, 62);
    };
    rowWeapon(14, wn.key, wn.label, pl.ammo.normal, "normal");
    rowWeapon(182, wh.key, wh.label, pl.ammo.heavy, "heavy");
    rowWeapon(350, wc.key, wc.label, pl.ammo.cluster, "cluster");
    ctx.fillStyle = "#7ea0ff";
    ctx.fillText("현재 턴 탄약 · [R] 재시작", WIDTH - 220, 62);
  };

  GF.drawTerrain = () => {
    const { WIDTH, HEIGHT } = GF.config;
    const { ctx, state } = GF;

    ctx.beginPath();
    ctx.moveTo(0, state.terrain[0]);
    for (let x = 1; x < WIDTH; x++) {
      ctx.lineTo(x, state.terrain[x]);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fillStyle = "#6e4a2a";
    ctx.fill();

    ctx.strokeStyle = "#52351d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, state.terrain[0]);
    for (let x = 1; x < WIDTH; x += 2) {
      ctx.lineTo(x, state.terrain[x]);
    }
    ctx.stroke();
  };

  GF.drawCannon = (cannon, angle) => {
    const { ctx } = GF;
    const bodyW = 30;
    const bodyH = 18;
    const barrelLen = 30;

    ctx.fillStyle = "#8f95b5";
    ctx.fillRect(cannon.x - bodyW / 2, cannon.y - bodyH, bodyW, bodyH);

    const muzzleX = cannon.x + Math.cos(angle) * barrelLen;
    const muzzleY = cannon.y - 14 + Math.sin(angle) * barrelLen;
    ctx.strokeStyle = "#d6d9e8";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cannon.x, cannon.y - 14);
    ctx.lineTo(muzzleX, muzzleY);
    ctx.stroke();

    ctx.fillStyle = "#3a4060";
    ctx.fillRect(cannon.x - 6, cannon.y - 4, 12, 12);
  };

  GF.drawAimLine = () => {
    if (GF.state.gameOver || GF.state.projectiles.length > 0) return;

    const { ctx } = GF;
    const aim = GF.getAimForTurn();
    const startX = aim.shooter.x;
    const startY = aim.shooter.y - 14;
    const lineLen = GF.clamp(aim.power * 0.42, 24, 210);
    const endX = startX + Math.cos(aim.angle) * lineLen;
    const endY = startY + Math.sin(aim.angle) * lineLen;

    ctx.strokeStyle = "#e8f1ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  GF.drawProjectiles = () => {
    GF.state.projectiles.forEach((p) => {
      GF.ctx.fillStyle = p.clusterChild ? "#b8ffb0" : "#fff3b0";
      GF.ctx.fillRect(GF.snap(p.x) - 3, GF.snap(p.y) - 3, 6, 6);
    });
  };

  GF.drawExplosions = () => {
    const { ctx, state } = GF;
    state.explosions.forEach((e) => {
      const t = e.age / e.duration;
      const radius = e.radius * t;
      ctx.fillStyle = t < 0.5 ? "#ffd56b" : "#ff8f52";
      ctx.beginPath();
      ctx.arc(e.x, e.y, GF.snap(radius), 0, Math.PI * 2);
      ctx.fill();
    });
  };

  GF.drawGameOverOverlay = () => {
    const { WIDTH, HEIGHT, UI_HEIGHT, TURN_NAMES } = GF.config;
    const { ctx, state } = GF;
    if (!state.gameOver || state.winner === null) return;

    ctx.fillStyle = "rgba(7, 10, 24, 0.72)";
    ctx.fillRect(0, UI_HEIGHT, WIDTH, HEIGHT - UI_HEIGHT);

    ctx.fillStyle = "#e4ecff";
    ctx.font = "bold 34px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${TURN_NAMES[state.winner]} 승리!`, WIDTH / 2, HEIGHT / 2 - 18);

    ctx.font = "20px 'Courier New', monospace";
    ctx.fillStyle = "#9ec0ff";
    ctx.fillText("R 키: 다시 시작", WIDTH / 2, HEIGHT / 2 + 28);
    ctx.textAlign = "left";
  };

  GF.draw = () => {
    const { WIDTH, HEIGHT } = GF.config;
    const { ctx, state } = GF;

    ctx.fillStyle = "#0d1f72";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    GF.drawUi();
    GF.drawTerrain();

    const cannons = GF.getCannonPositions();
    const aim = GF.getAimForTurn();
    GF.drawCannon(cannons[0], state.turn === 0 ? aim.angle : -0.35);
    GF.drawCannon(cannons[1], state.turn === 1 ? aim.angle : Math.PI + 0.35);

    GF.drawAimLine();
    GF.drawProjectiles();
    GF.drawExplosions();
    GF.drawGameOverOverlay();
  };
})();
