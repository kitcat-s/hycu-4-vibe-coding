(function () {
  const GF = window.GF;

  GF.bindInput = () => {
    GF.canvas.addEventListener("mousemove", (event) => {
      const rect = GF.canvas.getBoundingClientRect();
      GF.state.mouse.x = GF.snap(event.clientX - rect.left);
      GF.state.mouse.y = GF.snap(event.clientY - rect.top);
    });

    GF.canvas.addEventListener("click", () => {
      GF.launchProjectile();
    });
  };
})();
