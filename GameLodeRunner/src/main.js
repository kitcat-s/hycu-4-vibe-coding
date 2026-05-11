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

/** 데모: H키로 피격(생명 감소) */
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyH") game.applyDemoHit();
});

const loop = createGameLoop({
  update: (dt) => game.update(dt),
  render: () => game.render(),
});

loop.start();
