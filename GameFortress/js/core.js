const GF = window.GF || (window.GF = {});

GF.config = {
  WIDTH: 800,
  HEIGHT: 600,
  UI_HEIGHT: 56,
  GRID: 4,
  GRAVITY: 9.8,
  PIXELS_PER_METER: 18,
  TURN_NAMES: ["PLAYER 1", "PLAYER 2"],
};

GF.canvas = document.getElementById("game");
GF.ctx = GF.canvas.getContext("2d");
GF.ctx.imageSmoothingEnabled = false;

GF.snap = (v) => Math.floor(v / GF.config.GRID) * GF.config.GRID;
GF.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
GF.randomWind = () => Math.floor(Math.random() * 21) - 10;

GF.state = {
  terrain: [],
  turn: 0,
  wind: GF.randomWind(),
  mouse: { x: GF.config.WIDTH / 2, y: GF.config.HEIGHT / 2 },
  projectile: null,
  explosions: [],
  lastTime: performance.now(),
};
