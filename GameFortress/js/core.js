const GF = window.GF || (window.GF = {});

GF.config = {
  WIDTH: 800,
  HEIGHT: 600,
  UI_HEIGHT: 88,
  GRID: 4,
  GRAVITY: 9.8,
  PIXELS_PER_METER: 18,
  TURN_NAMES: ["PLAYER 1", "PLAYER 2"],
  MAX_HP: 100,
  START_AMMO: { normal: 40, heavy: 5, cluster: 3 },
};

GF.WEAPONS = {
  normal: { key: "1", label: "일반탄", explosionRadius: 32, maxDamage: 52 },
  heavy: { key: "2", label: "고폭탄", explosionRadius: 52, maxDamage: 46 },
  cluster: {
    key: "3",
    label: "클러스터",
    childExplosionRadius: 28,
    maxDamagePerChild: 36,
    splitSpeedScale: 0.88,
    spread: [-0.38, 0, 0.38],
  },
};

GF.canvas = document.getElementById("game");
GF.ctx = GF.canvas.getContext("2d");
GF.ctx.imageSmoothingEnabled = false;

GF.snap = (v) => Math.floor(v / GF.config.GRID) * GF.config.GRID;
GF.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
GF.randomWind = () => Math.floor(Math.random() * 21) - 10;

function createPlayerState() {
  return {
    hp: GF.config.MAX_HP,
    ammo: { ...GF.config.START_AMMO },
    selectedWeapon: "normal",
  };
}

GF.createPlayers = () => [createPlayerState(), createPlayerState()];

GF.state = {
  terrain: [],
  turn: 0,
  wind: GF.randomWind(),
  mouse: { x: GF.config.WIDTH / 2, y: GF.config.HEIGHT / 2 },
  projectiles: [],
  explosions: [],
  lastTime: performance.now(),
  players: GF.createPlayers(),
  gameOver: false,
  winner: null,
};

GF.resetMatch = () => {
  const s = GF.state;
  s.terrain = GF.createTerrain();
  s.turn = 0;
  s.wind = GF.randomWind();
  s.projectiles = [];
  s.explosions = [];
  s.players = GF.createPlayers();
  s.gameOver = false;
  s.winner = null;
};
