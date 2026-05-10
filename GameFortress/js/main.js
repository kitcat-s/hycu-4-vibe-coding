(function () {
  const GF = window.GF;

  GF.tick = (now) => {
    const dt = Math.min((now - GF.state.lastTime) / 1000, 0.05);
    GF.state.lastTime = now;
    GF.updateProjectile(dt);
    GF.updateExplosions(dt);
    GF.updateHitParticles(dt);
    GF.draw();
    requestAnimationFrame(GF.tick);
  };

  GF.start = () => {
    GF.resetMatch();
    if (!GF._inputBound) {
      GF.bindInput();
      GF._inputBound = true;
    }
    requestAnimationFrame((now) => {
      GF.state.lastTime = now;
      GF.tick(now);
    });
  };

  GF.start();
})();
