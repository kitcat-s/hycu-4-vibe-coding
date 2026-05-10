(function () {
  const GF = window.GF;

  GF.switchTurn = () => {
    GF.state.turn = GF.state.turn === 0 ? 1 : 0;
    GF.state.wind = GF.randomWind();
  };

  GF.hitCannon = (projectile, cannon) => {
    const halfW = 18;
    const top = cannon.y - 28;
    const bottom = cannon.y + 8;
    return (
      projectile.x >= cannon.x - halfW &&
      projectile.x <= cannon.x + halfW &&
      projectile.y >= top &&
      projectile.y <= bottom
    );
  };

  GF.explode = (x, y) => {
    const radius = 32;
    GF.state.explosions.push({ x, y, age: 0, duration: 0.35, radius });
    GF.damageTerrain(x, y, radius);
    GF.state.projectile = null;
    GF.switchTurn();
  };

  GF.launchProjectile = () => {
    if (GF.state.projectile) return;

    const aim = GF.getAimForTurn();
    const muzzleX = aim.shooter.x + Math.cos(aim.angle) * 28;
    const muzzleY = aim.shooter.y - 14 + Math.sin(aim.angle) * 28;
    GF.state.projectile = {
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(aim.angle) * aim.power,
      vy: Math.sin(aim.angle) * aim.power,
    };
  };

  GF.updateProjectile = (dt) => {
    if (!GF.state.projectile) return;

    const { WIDTH, HEIGHT, UI_HEIGHT, PIXELS_PER_METER, GRAVITY } = GF.config;
    const p = GF.state.projectile;
    const windAccel = GF.state.wind * PIXELS_PER_METER * 0.35;
    p.vx += windAccel * dt;
    p.vy += GRAVITY * PIXELS_PER_METER * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < 0 || p.x >= WIDTH || p.y >= HEIGHT || p.y < UI_HEIGHT) {
      GF.state.projectile = null;
      GF.switchTurn();
      return;
    }

    const terrainY = GF.state.terrain[GF.clamp(Math.floor(p.x), 0, WIDTH - 1)];
    if (p.y >= terrainY) {
      GF.explode(p.x, p.y);
      return;
    }

    const enemy = GF.getCannonPositions()[GF.state.turn === 0 ? 1 : 0];
    if (GF.hitCannon(p, enemy)) {
      GF.explode(enemy.x, enemy.y - 10);
    }
  };

  GF.updateExplosions = (dt) => {
    GF.state.explosions = GF.state.explosions.filter((e) => {
      e.age += dt;
      return e.age <= e.duration;
    });
  };
})();
