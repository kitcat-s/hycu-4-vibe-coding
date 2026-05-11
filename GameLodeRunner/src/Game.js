import { GameState } from "./GameState.js";
import { isKeyDown } from "./Input.js";
import { Player } from "./Player.js";
import { Coin } from "./Coin.js";

const GROUND_Y = 520;

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ score: HTMLElement, level: HTMLElement, lives: HTMLElement }} hud
   * @param {ReturnType<typeof import('./AudioManager.js').createAudioManager>} audio
   */
  constructor(canvas, hud, audio) {
    this.canvas = canvas;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
    this.hud = hud;
    this.audio = audio;

    /** @type {import('./GameState.js').GameStateId} */
    this.state = GameState.MENU;
    this.score = 0;
    this.level = 1;
    /** @type {import('./GameObject.js').GameObject[]} */
    this.objects = [];
    this.player = new Player();

    this._wasSpace = false;
    this._wasKeyR = false;
  }

  resetPlaying() {
    this.player = new Player();
    this.player.lives = 3;
    this.score = 0;
    this.level = 1;
    this.spawnLevel();
  }

  spawnLevel() {
    this.objects = [];
    const count = 4 + this.level;
    for (let i = 0; i < count; i++) {
      const x = 120 + ((i * 137) % (800 - 240));
      const y = 360 + (i % 3) * 50;
      this.objects.push(new Coin(x, y));
    }
  }

  nextLevel() {
    this.level += 1;
    this.spawnLevel();
  }

  /** @param {number} dt */
  update(dt) {
    const space = isKeyDown("Space");
    const keyR = isKeyDown("KeyR");

    if (this.state === GameState.MENU) {
      if (space && !this._wasSpace) {
        this.audio.playMenuSelect();
        this.audio.resumeFromUserGesture();
        this.resetPlaying();
        this.state = GameState.PLAYING;
      }
      this._wasSpace = space;
      this._wasKeyR = keyR;
      this.syncHud();
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      if (keyR && !this._wasKeyR) {
        this.audio.playMenuSelect();
        this.resetPlaying();
        this.state = GameState.PLAYING;
      }
      this._wasSpace = space;
      this._wasKeyR = keyR;
      this.syncHud();
      return;
    }

    this._wasSpace = space;
    this._wasKeyR = keyR;

    this.player.updateWithInput(
      dt,
      (code) => isKeyDown(code),
      () => {
        this.audio.playJump();
      },
    );

    for (const o of this.objects) o.update(dt);

    for (const o of this.objects) {
      if (!(o instanceof Coin) || o.markedForRemoval) continue;
      const oy = o.y + o.bobOffset;
      const dx = o.x - this.player.x;
      const dy = oy - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < o.radius + 18) {
        o.markedForRemoval = true;
        this.score += 100;
        this.audio.playCollect();
      }
    }

    this.objects = this.objects.filter((o) => !o.markedForRemoval);

    if (this.objects.length === 0) {
      this.nextLevel();
    }

    this.syncHud();
  }

  syncHud() {
    this.hud.score.textContent = String(this.score);
    this.hud.level.textContent = String(this.level);
    this.hud.lives.textContent = String(this.player.lives);
  }

  /** 데모용: H로 데미지 */
  applyDemoHit() {
    if (this.state !== GameState.PLAYING) return;
    this.player.lives -= 1;
    this.audio.playHit();
    if (this.player.lives <= 0) {
      this.state = GameState.GAME_OVER;
    }
  }

  render() {
    const { ctx, canvas } = this;
    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바닥
    ctx.fillStyle = "#21262d";
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.strokeStyle = "#30363d";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    this.player.render(ctx);
    for (const o of this.objects) o.render(ctx);

    if (this.state === GameState.MENU) {
      this.drawOverlay("로드 러너 엔진 데모", "스페이스: 게임 시작");
    } else if (this.state === GameState.GAME_OVER) {
      this.drawOverlay("게임 오버", "R: 다시 시작");
    }
  }

  /**
   * @param {string} title
   * @param {string} subtitle
   */
  drawOverlay(title, subtitle) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = "rgba(1, 4, 9, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e6edf3";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 28px system-ui";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = "16px system-ui";
    ctx.fillStyle = "#8b949e";
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
  }
}
