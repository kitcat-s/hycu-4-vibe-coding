import { GameObject } from "./GameObject.js";

const SPEED = 220;
const GROUND_Y = 520;
/** 로컬 좌표 기준 다리 하단(~y+26)이 GROUND_Y에 닿도록 앵커 오프셋 */
const FEET_GROUND_OFFSET = 26;
const GRAVITY = 980;
const JUMP_V = -420;

export class Player extends GameObject {
  constructor() {
    super(400, GROUND_Y - FEET_GROUND_OFFSET);
    this.lives = 3;
    this.facing = 1;
    this.onGround = true;
    /** @private */
    this._upWasDown = false;
  }

  get groundFeetY() {
    return GROUND_Y - FEET_GROUND_OFFSET;
  }

  /**
   * @param {number} dt
   * @param {(code: string) => boolean} keyDown
   * @param {() => void} onJump
   */
  updateWithInput(dt, keyDown, onJump) {
    let ax = 0;
    if (keyDown("ArrowLeft")) {
      ax -= 1;
      this.facing = -1;
    }
    if (keyDown("ArrowRight")) {
      ax += 1;
      this.facing = 1;
    }
    this.vx = ax * SPEED;

    const up = keyDown("ArrowUp");
    if (this.onGround && up && !this._upWasDown) {
      this.vy = JUMP_V;
      this.onGround = false;
      onJump();
    }
    this._upWasDown = up;

    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const margin = 24;
    this.x = Math.min(800 - margin, Math.max(margin, this.x));

    const floorY = this.groundFeetY;
    if (this.y >= floorY) {
      this.y = floorY;
      this.vy = 0;
      this.onGround = true;
    }
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    const x = this.x;
    const y = this.y;
    const s = this.facing;

    ctx.save();

    ctx.translate(x, y);
    ctx.scale(s, 1);

    const outline = "#1a2a3d";
    const head = "#e4c4a0";
    const arms = "#e4c4a0";
    const shirt = "#4e8ece";
    const pants = "#2f4f78";

    ctx.lineWidth = 2;
    ctx.strokeStyle = outline;

    // 머리(원)
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, -20, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 얼굴: 눈 + 미소
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.arc(-3.5, -22, 1.5, 0, Math.PI * 2);
    ctx.arc(3.5, -22, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -19.5, 4.5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // 몸통(사각형)
    ctx.fillStyle = shirt;
    ctx.fillRect(-10, -12, 20, 20);

    // 팔(둥근 사각형, 살짝 벌린 자세)
    ctx.fillStyle = arms;
    ctx.save();
    ctx.translate(-10, -15);
    ctx.rotate((22 * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-1, 3.5, 5.5, 16, 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(10, -15);
    ctx.rotate((-22 * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-5, 3.5, 5.5, 16, 3);
    ctx.fill();
    ctx.restore();

    // 다리(둥근 사각형)
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-10, 2, 7, 16, 2);
    ctx.roundRect(3, 2, 7, 16, 2);
    ctx.fill();

    ctx.restore();
  }
}
