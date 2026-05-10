(function () {
  const GF = window.GF;

  GF.tick = (now) => {
    const dt = Math.min((now - GF.state.lastTime) / 1000, 0.05);
    GF.state.lastTime = now;
    GF.updateProjectile(dt);
    GF.updateExplosions(dt);
    GF.draw();
    requestAnimationFrame(GF.tick);
  };

  GF.start = () => {
    GF.state.terrain = GF.createTerrain();
    GF.bindInput();
    requestAnimationFrame((now) => {
      GF.state.lastTime = now;
      GF.tick(now);
    });
  };

  GF.start();
})();
