import { GameState } from "./GameState.js";
import { consumeKeyPress, isKeyDown } from "./Input.js";
import { Player } from "./Player.js";
import { TileMap, TILE_SIZE } from "./TileMap.js";
import { Camera } from "./Camera.js";
import { Guard } from "./Guard.js";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

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
    /** @type {Guard[]} */
    this.guards = [];
    this.startCell = { col: 2, row: 12 };
    this.lastEnemyAlert = 0;
    this.startRequested = false;
    this.restartRequested = false;

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") this.startRequested = true;
      if (e.code === "KeyR") this.restartRequested = true;
    });

    this._wasKeyZ = false;
    this._wasKeyX = false;
  }

  resetPlaying() {
    this.map = new TileMap();
    this.player = new Player();
    this.player.lives = 3;
    this.score = 0;
    this.level = 1;
    this.message = "";
    this.guards = [
      new Guard(6, 0, { speed: 0.34, intelligence: 0.45, vision: 18, color: "#ca5c5c" }),
      new Guard(10, 9, { speed: 0.28, intelligence: 0.85, vision: 24, color: "#d97f3f" }),
    ];
    this.lastEnemyAlert = 0;
  }

  respawnPlayer() {
    this.player = new Player();
    this.player.lives = Math.max(0, this.player.lives);
    this.player.x = this.startCell.col * TILE_SIZE;
    this.player.y = this.startCell.row * TILE_SIZE;
    this.player.col = this.startCell.col;
    this.player.row = this.startCell.row;
  }

  loseLife(reason = "사망") {
    this.player.lives -= 1;
    this.audio.playHit();
    if (this.player.lives <= 0) {
      this.message = `게임 오버 (${reason})`;
      this.state = GameState.GAME_OVER;
      this.audio.stopBgm();
      return;
    }
    const lives = this.player.lives;
    this.respawnPlayer();
    this.player.lives = lives;
  }

  /** @param {number} dt */
  update(dt) {
    const pressedSpace = consumeKeyPress("Space") || this.startRequested;
    const pressedR = consumeKeyPress("KeyR") || this.restartRequested;

    if (pressedR && this.state !== GameState.MENU) {
      this.audio.playMenuSelect();
      this.resetPlaying();
      this.state = GameState.PLAYING;
      this.audio.playBgm();
      this.startRequested = false;
      this.restartRequested = false;
      this.syncHud();
      return;
    }

    if (this.state === GameState.MENU) {
      if (pressedSpace) {
        this.audio.playMenuSelect();
        this.audio.resumeFromUserGesture();
        this.resetPlaying();
        this.state = GameState.PLAYING;
        this.audio.playBgm();
        this.startRequested = false;
        this.restartRequested = false;
      }
      this.syncHud();
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      if (pressedR) {
        this.audio.playMenuSelect();
        this.resetPlaying();
        this.state = GameState.PLAYING;
        this.audio.playBgm();
        this.startRequested = false;
        this.restartRequested = false;
      }
      this.syncHud();
      return;
    }

    this.startRequested = false;
    this.restartRequested = false;
    const keyZ = isKeyDown("KeyZ");
    const keyX = isKeyDown("KeyX");

    this.player.updateWithInput(dt, this.map, (code) => isKeyDown(code));
    // 카메라 튐 방지: 플레이어 월드 좌표를 맵 경계 안으로 고정
    this.player.x = clamp(this.player.x, 0, this.map.width - TILE_SIZE);
    this.player.y = clamp(this.player.y, 0, this.map.height - TILE_SIZE);
    const pCol = Math.round(this.player.x / TILE_SIZE);
    const pRow = Math.round(this.player.y / TILE_SIZE);

    if ((this.player.moveMode === "walk" && this.player.moving) || this.player.animState === "walk") {
      this.audio.playWalk(dt);
    }

    // 드릴: 플레이어 양쪽 바닥만 허용
    const drillRow = pRow + 1;
    if (keyZ && !this._wasKeyZ && this.map.drill(pCol - 1, drillRow, 15)) this.audio.playDrill();
    if (keyX && !this._wasKeyX && this.map.drill(pCol + 1, drillRow, 15)) this.audio.playDrill();
    this._wasKeyZ = keyZ;
    this._wasKeyX = keyX;

    this.map.update(dt);

    if (this.map.collectGold(pCol, pRow)) {
      this.score += 100;
      this.audio.playCollect();
    }

    if (this.map.exitActive && this.map.isExit(pCol, pRow)) {
      this.message = "탈출 성공!";
      this.state = GameState.GAME_OVER;
      this.audio.stopBgm();
    }

    for (const guard of this.guards) {
      guard.updateAI(dt, this.map, { col: pCol, row: pRow });
      const gCol = Math.round(guard.x / TILE_SIZE);
      const gRow = Math.round(guard.y / TILE_SIZE);
      const dist = Math.abs(gCol - pCol) + Math.abs(gRow - pRow);
      if (dist <= 5) this.lastEnemyAlert += dt;
      if (dist <= 5 && this.lastEnemyAlert >= 0.8) {
        this.audio.playEnemyAlert();
        this.lastEnemyAlert = 0;
      }
      if (gCol === pCol && gRow === pRow && guard.trappedTimer <= 0) {
        this.loseLife("적과 충돌");
        break;
      }
    }

    if (this.player.justHardLanded) {
      this.loseLife("높은 곳 낙하");
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
    for (const guard of this.guards) guard.render(ctx);
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
