(function () {
  const GF = window.GF;

  GF.createTerrain = () => {
    const { WIDTH, HEIGHT, BOTTOM_UI_HEIGHT } = GF.config;
    const panelTop = HEIGHT - BOTTOM_UI_HEIGHT;
    const terrainMaxY = panelTop - 28;
    const terrain = new Array(WIDTH).fill(terrainMaxY);
    let y = 420 + Math.floor(Math.random() * 50);
    const step = 12;

    for (let x = 0; x < WIDTH; x += step) {
      y += (Math.random() - 0.5) * 24;
      y = GF.clamp(y, 290, terrainMaxY);
      const nextX = Math.min(WIDTH - 1, x + step);
      const nextY = GF.clamp(y + (Math.random() - 0.5) * 8, 290, terrainMaxY);
      for (let ix = x; ix <= nextX; ix++) {
        const t = (ix - x) / (nextX - x || 1);
        terrain[ix] = GF.snap(y + (nextY - y) * t);
      }
    }

    return terrain;
  };

  GF.damageTerrain = (x, y, radius) => {
    const { WIDTH, HEIGHT, UI_HEIGHT, BOTTOM_UI_HEIGHT } = GF.config;
    const panelTop = HEIGHT - BOTTOM_UI_HEIGHT;
    const start = Math.max(0, Math.floor(x - radius));
    const end = Math.min(WIDTH - 1, Math.ceil(x + radius));

    for (let ix = start; ix <= end; ix++) {
      const dx = ix - x;
      const bowl = Math.sqrt(Math.max(0, radius * radius - dx * dx));
      const carved = y + bowl;
      GF.state.terrain[ix] = GF.clamp(Math.max(GF.state.terrain[ix], carved), UI_HEIGHT + 10, panelTop - 2);
    }
  };
})();
