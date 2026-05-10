(function () {
  const GF = window.GF;

  GF.bindInput = () => {
    GF.canvas.addEventListener("mousemove", (event) => {
      const rect = GF.canvas.getBoundingClientRect();
      GF.state.mouse.x = GF.snap(event.clientX - rect.left);
      GF.state.mouse.y = GF.snap(event.clientY - rect.top);
    });

    GF.canvas.addEventListener("click", () => {
      if (GF.state.gameOver) return;
      GF.launchProjectile();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        e.preventDefault();
        GF.resetMatch();
        return;
      }
      if (GF.state.gameOver) return;
      if (GF.state.projectiles.length > 0) return;

      const pl = GF.state.players[GF.state.turn];
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        GF.moveCurrentPlayer(-1);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        GF.moveCurrentPlayer(1);
      } else if (e.code === "Digit1") {
        e.preventDefault();
        pl.selectedWeapon = "normal";
      } else if (e.code === "Digit2") {
        e.preventDefault();
        pl.selectedWeapon = "heavy";
      } else if (e.code === "Digit3") {
        e.preventDefault();
        pl.selectedWeapon = "cluster";
      }
    });
  };
})();
