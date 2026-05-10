(function () {
  const GF = window.GF;

  GF.switchTurn = () => {
    if (GF.state.gameOver) return;
    GF.state.turn = GF.state.turn === 0 ? 1 : 0;
    GF.state.wind = GF.randomWind();
  };

  GF.getCannonHitPoint = (cannon) => ({ x: cannon.x, y: cannon.y - 10 });

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

  GF.damageFromExplosion = (ex, ey, radius, maxDamage, targetIndex) => {
    const cannons = GF.getCannonPositions();
    const pt = GF.getCannonHitPoint(cannons[targetIndex]);
    const dist = Math.hypot(ex - pt.x, ey - pt.y);
    if (dist > radius) return 0;
    const t = 1 - dist / radius;
    return Math.round(maxDamage * t * t);
  };

  GF.applyExplosionToPlayers = (ex, ey, radius, maxDamage, shooterIndex) => {
    const target = shooterIndex === 0 ? 1 : 0;
    const dmg = GF.damageFromExplosion(ex, ey, radius, maxDamage, target);
    if (dmg <= 0) return;
    GF.state.players[target].hp = GF.clamp(GF.state.players[target].hp - dmg, 0, GF.config.MAX_HP);
    if (GF.state.players[target].hp <= 0) {
      GF.state.gameOver = true;
      GF.state.winner = shooterIndex;
      GF.state.projectiles = [];
    }
  };

  GF.addExplosionVisual = (x, y, radius) => {
    GF.state.explosions.push({ x, y, age: 0, duration: 0.35, radius });
  };

  GF.resolveExplosion = (x, y, weapon, shooterIndex) => {
    const w = GF.WEAPONS[weapon];
    let radius;
    let maxDmg;
    if (weapon === "cluster") {
      radius = w.childExplosionRadius;
      maxDmg = w.maxDamagePerChild;
    } else {
      radius = w.explosionRadius;
      maxDmg = w.maxDamage;
    }

    GF.addExplosionVisual(x, y, radius);
    GF.damageTerrain(x, y, radius);
    GF.applyExplosionToPlayers(x, y, radius, maxDmg, shooterIndex);
  };

  GF.splitCluster = (p, shooterIndex) => {
    const cfg = GF.WEAPONS.cluster;
    const speed = Math.hypot(p.vx, p.vy) * cfg.splitSpeedScale;
    const base = Math.atan2(p.vy, p.vx);
    const idx = GF.state.projectiles.indexOf(p);
    if (idx !== -1) GF.state.projectiles.splice(idx, 1);

    cfg.spread.forEach((s) => {
      const a = base + s;
      GF.state.projectiles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        weapon: "cluster",
        clusterChild: true,
        owner: shooterIndex,
      });
    });
  };

  GF.launchProjectile = () => {
    if (GF.state.gameOver) return;
    if (GF.state.projectiles.length > 0) return;

    const pl = GF.state.players[GF.state.turn];
    const w = pl.selectedWeapon;
    if (pl.ammo[w] <= 0) return;

    pl.ammo[w] -= 1;
    const aim = GF.getAimForTurn();
    const muzzleX = aim.shooter.x + Math.cos(aim.angle) * 28;
    const muzzleY = aim.shooter.y - 14 + Math.sin(aim.angle) * 28;
    const owner = GF.state.turn;

    GF.state.projectiles.push({
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(aim.angle) * aim.power,
      vy: Math.sin(aim.angle) * aim.power,
      weapon: w,
      owner,
      clusterChild: false,
      splitDone: w !== "cluster",
    });
  };

  GF.tryClusterSplit = (p) => {
    if (p.weapon !== "cluster" || p.clusterChild || p.splitDone) return false;
    if (p.vy <= 0) return false;
    const xi = GF.clamp(Math.floor(p.x), 0, GF.config.WIDTH - 1);
    const ground = GF.state.terrain[xi];
    if (p.y >= ground - 36) return false;
    p.splitDone = true;
    GF.splitCluster(p, p.owner);
    return true;
  };

  GF.removeProjectile = (p) => {
    const i = GF.state.projectiles.indexOf(p);
    if (i !== -1) GF.state.projectiles.splice(i, 1);
  };

  GF.onProjectileGone = () => {
    if (GF.state.gameOver) return;
    if (GF.state.projectiles.length === 0) GF.switchTurn();
  };

  GF.updateProjectile = (dt) => {
    const { WIDTH, HEIGHT, UI_HEIGHT, PIXELS_PER_METER, GRAVITY } = GF.config;
    const list = GF.state.projectiles;
    if (list.length === 0) return;

    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      const windAccel = GF.state.wind * PIXELS_PER_METER * 0.35;
      p.vx += windAccel * dt;
      p.vy += GRAVITY * PIXELS_PER_METER * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (GF.tryClusterSplit(p)) continue;

      if (p.x < 0 || p.x >= WIDTH || p.y >= HEIGHT || p.y < UI_HEIGHT) {
        GF.removeProjectile(p);
        GF.onProjectileGone();
        continue;
      }

      const terrainY = GF.state.terrain[GF.clamp(Math.floor(p.x), 0, WIDTH - 1)];
      if (p.y >= terrainY) {
        const ex = p.x;
        const ey = p.y;
        const own = p.owner;
        const boom =
          p.weapon === "cluster" && !p.clusterChild ? "normal" : p.clusterChild ? "cluster" : p.weapon;
        GF.removeProjectile(p);
        GF.resolveExplosion(ex, ey, boom, own);
        if (!GF.state.gameOver) GF.onProjectileGone();
        continue;
      }

      const enemyIdx = p.owner === 0 ? 1 : 0;
      const enemy = GF.getCannonPositions()[enemyIdx];
      if (GF.hitCannon(p, enemy)) {
        const ex = enemy.x;
        const ey = enemy.y - 10;
        const own = p.owner;
        const boom = p.clusterChild ? "cluster" : p.weapon;
        GF.removeProjectile(p);
        GF.resolveExplosion(ex, ey, boom, own);
        if (!GF.state.gameOver) GF.onProjectileGone();
      }
    }
  };

  GF.updateExplosions = (dt) => {
    GF.state.explosions = GF.state.explosions.filter((e) => {
      e.age += dt;
      return e.age <= e.duration;
    });
  };
})();
