import { GameState } from "./GameState.js";
import { isKeyDown } from "./Input.js";
import { Player } from "./Player.js";
import { TileMap, TILE_SIZE } from "./TileMap.js";
import { Camera } from "./Camera.js";

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
    this.message = "";
    this.map = new TileMap();
    this.camera = new Camera(canvas.width, canvas.height);
    this.player = new Player();

    this._wasSpace = false;
    this._wasKeyR = false;
  }

  resetPlaying() {
    this.map = new TileMap();
    this.player = new Player();
    this.player.lives = 3;
    this.score = 0;
    this.level = 1;
    this.message = "";
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

    this.player.updateWithInput(dt, this.map, (code) => isKeyDown(code));
    const pCol = Math.round(this.player.x / TILE_SIZE);
    const pRow = Math.round(this.player.y / TILE_SIZE);

    if (this.map.collectGold(pCol, pRow)) {
      this.score += 100;
      this.audio.playCollect();
    }

    if (this.map.goldRemaining === 0 && this.map.isExit(pCol, pRow)) {
      this.message = "탈출 성공!";
      this.state = GameState.GAME_OVER;
    }

    this.camera.follow(this.player.centerX, this.player.centerY, this.map.width, this.map.height);
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
    ctx.fillStyle = "#040404";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    this.map.render(ctx);
    this.player.render(ctx);
    ctx.restore();

    if (this.state === GameState.MENU) {
      this.drawOverlay("로드 러너 테스트 맵", "스페이스: 시작");
    } else if (this.state === GameState.GAME_OVER) {
      this.drawOverlay(this.message || "게임 오버", "R: 다시 시작");
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
