import { createGameLoop } from "./GameLoop.js";
import { attachKeyboard } from "./Input.js";
import { createAudioManager } from "./AudioManager.js";
import { Game } from "./Game.js";

const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("game"));
if (!canvas) throw new Error("#game 캔버스 없음");

const hud = {
  score: /** @type {HTMLElement} */ (document.getElementById("hud-score")),
  level: /** @type {HTMLElement} */ (document.getElementById("hud-level")),
  lives: /** @type {HTMLElement} */ (document.getElementById("hud-lives")),
};

const audio = createAudioManager();
const game = new Game(canvas, hud, audio);

attachKeyboard(canvas);
canvas.focus();

const loop = createGameLoop({
  update: (dt) => game.update(dt),
  render: () => game.render(),
});

loop.start();
