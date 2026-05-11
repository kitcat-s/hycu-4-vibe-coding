import { GameObject } from "./GameObject.js";
import { TILE_SIZE } from "./TileMap.js";

const MOVE_DURATION = 0.3;
const VISUAL_SCALE = 0.82;

const ANIM = {
  IDLE: "idle",
  WALK: "walk",
  CLIMB: "climb",
  FALL: "fall",
};

export class Player extends GameObject {
  constructor() {
    super(TILE_SIZE * 2, TILE_SIZE * 12);
    this.lives = 3;
    this.facing = 1;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
    this.col = 2;
    this.row = 12;
    this.moving = false;
    this.moveT = 0;
    this.moveDuration = MOVE_DURATION;
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = this.x;
    this.toY = this.y;
    this.animState = ANIM.IDLE;
    this.animTime = 0;
    this.moveDx = 0;
    this.moveDy = 0;
    this.moveMode = "walk";
    this.trappedTimer = 0;
    this.fallChain = 0;
    this.justHardLanded = false;
  }

  /**
   * @param {number} dt
   * @param {import("./TileMap.js").TileMap} map
   * @param {(code: string) => boolean} keyDown
   */
  updateWithInput(dt, map, keyDown) {
    this.animTime += dt;
    this.justHardLanded = false;

    if (this.trappedTimer > 0) {
      this.trappedTimer -= dt;
      this.animState = ANIM.FALL;
      if (this.trappedTimer <= 0 && !map.isSolid(this.col, this.row - 1)) {
        this.tryMove(map, this.col, this.row - 1, "ladder");
      }
      return;
    }

    if (map.isHole(this.col, this.row)) {
      this.trapInHole(3.5);
      return;
    }

    if (this.moving) {
      this.moveT += dt;
      const t = Math.min(1, this.moveT / this.moveDuration);
      this.x = this.fromX + (this.toX - this.fromX) * t;
      this.y = this.fromY + (this.toY - this.fromY) * t;
      if (t >= 1) {
        this.moving = false;
        this.x = this.toX;
        this.y = this.toY;
        this.col = Math.round(this.x / TILE_SIZE);
        this.row = Math.round(this.y / TILE_SIZE);
        this.animState = ANIM.IDLE;
        if (this.moveMode === "gravity") this.fallChain += 1;
        else {
          if (this.fallChain >= 4) this.justHardLanded = true;
          this.fallChain = 0;
        }
      }
      if (this.moveDy > 0) this.animState = ANIM.CLIMB;
      else if (this.moveDy < 0) this.animState = ANIM.FALL;
      else if (this.moveDx !== 0) this.animState = ANIM.WALK;
      return;
    }

    this.col = Math.round(this.x / TILE_SIZE);
    this.row = Math.round(this.y / TILE_SIZE);

    const onLadder = map.isLadder(this.col, this.row);
    const onRope = map.isRope(this.col, this.row);
    const supported = map.isSolid(this.col, this.row + 1) || map.isLadder(this.col, this.row);
    if (supported && this.fallChain >= 4) {
      this.justHardLanded = true;
      this.fallChain = 0;
    }

    const up = keyDown("ArrowUp") || keyDown("KeyW");
    const down = keyDown("ArrowDown") || keyDown("KeyS");
    const left = keyDown("ArrowLeft") || keyDown("KeyA");
    const right = keyDown("ArrowRight") || keyDown("KeyD");

    // 위쪽 이동 우선 판정 (요청: ArrowUp 동작 보강)
    if (up && (onLadder || map.isLadder(this.col, this.row - 1)) && !map.isSolid(this.col, this.row - 1)) {
      this.tryMove(map, this.col, this.row - 1, "ladder");
      this.animState = ANIM.FALL;
      return;
    }

    // 중력: 지지대 없고, 사다리/로프 위가 아니면 한 칸 낙하
    if (!supported && !onLadder && !onRope && !map.isSolid(this.col, this.row + 1)) {
      this.tryMove(map, this.col, this.row + 1, "gravity");
      this.animState = ANIM.CLIMB;
      return;
    }

    if (down && (onLadder || map.isLadder(this.col, this.row + 1)) && !map.isSolid(this.col, this.row + 1)) {
      this.tryMove(map, this.col, this.row + 1, "ladder");
      this.animState = ANIM.FALL;
      return;
    }

    const canMoveH = supported || onLadder || onRope;
    if (left && canMoveH && !map.isSolid(this.col - 1, this.row)) {
      this.facing = -1;
      this.tryMove(map, this.col - 1, this.row, "walk");
      this.animState = ANIM.WALK;
      return;
    }

    if (right && canMoveH && !map.isSolid(this.col + 1, this.row)) {
      this.facing = 1;
      this.tryMove(map, this.col + 1, this.row, "walk");
      this.animState = ANIM.WALK;
      return;
    }

    this.animState = ANIM.IDLE;
  }

  /**
   * @param {import("./TileMap.js").TileMap} map
   * @param {number} col
   * @param {number} row
   * @param {string} mode
   */
  tryMove(map, col, row, mode = "walk") {
    if (!map.inBounds(col, row) || map.isSolid(col, row)) return;
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = col * TILE_SIZE;
    this.toY = row * TILE_SIZE;
    this.moveDx = col - this.col;
    this.moveDy = row - this.row;
    this.moveMode = mode;
    this.moveT = 0;
    this.moving = true;
  }

  /** @param {number} seconds */
  trapInHole(seconds) {
    this.moving = false;
    this.trappedTimer = Math.max(this.trappedTimer, seconds);
    this.fallChain = 0;
    this.animState = ANIM.FALL;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    const x = this.x + TILE_SIZE / 2;
    const y = this.y + TILE_SIZE / 2;
    const s = this.facing;
    const walkSwing = Math.sin(this.animTime * 18) * 0.2;
    const climbSwing = Math.sin(this.animTime * 14) * 0.5;
    const fallBob = Math.sin(this.animTime * 22) * 1.2;
    const isWalk = this.animState === ANIM.WALK;
    const isClimb = this.animState === ANIM.CLIMB;
    const isFall = this.animState === ANIM.FALL;
    const handsUp = isClimb || isFall;
    const armL = handsUp ? climbSwing * 0.2 : isWalk ? walkSwing : 0.05;
    const armR = handsUp ? -climbSwing * 0.2 : isWalk ? -walkSwing : -0.05;
    const legL = isWalk ? -walkSwing * 0.7 : isClimb ? climbSwing * 0.6 : 0;
    const legR = isWalk ? walkSwing * 0.7 : isClimb ? -climbSwing * 0.6 : 0;

    ctx.save();

    ctx.translate(x, y);
    ctx.scale(s, 1);
    ctx.scale(VISUAL_SCALE, VISUAL_SCALE);
    if (isFall) ctx.translate(0, fallBob);

    const outline = "#1a2a3d";
    const head = "#e4c4a0";
    const arms = "#e4c4a0";
    const body = "#4e8ece";

    ctx.lineWidth = 2;
    ctx.strokeStyle = outline;

    // 머리(원)
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, -20, 11, 0, Math.PI * 2);
    ctx.fill();

    // 눈
    ctx.fillStyle = outline;
    ctx.beginPath();
    ctx.arc(-4, -20, 2, 0, Math.PI * 2);
    ctx.arc(4, -20, 2, 0, Math.PI * 2);
    ctx.fill();

    // 몸통(사각형)
    ctx.fillStyle = body;
    ctx.fillRect(-10, -12, 20, 20);
    // ctx.strokeRect(-10, -12, 20, 20);

    // 팔(둥근 사각형, 살짝 벌린 자세)
    ctx.fillStyle = arms;
    ctx.save();
    ctx.translate(-10, -15);
    ctx.rotate(((handsUp ? 160 : 22) * Math.PI) / 180 + armL);
    ctx.beginPath();
    ctx.roundRect(-1, handsUp ? -8 : 3.5, 5.5, handsUp ? 20 : 16, 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(10, -15);
    ctx.rotate(((handsUp ? -160 : -22) * Math.PI) / 180 + armR);
    ctx.beginPath();
    ctx.roundRect(-5, handsUp ? -8 : 3.5, 5.5, handsUp ? 20 : 16, 3);
    ctx.fill();
    ctx.restore();

    // 다리(둥근 사각형)
    ctx.fillStyle = body;
    ctx.save();
    ctx.translate(-6.5, 2);
    ctx.rotate(legL);
    ctx.beginPath();
    ctx.roundRect(-3.5, 0, 7, 16, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(6.5, 2);
    ctx.rotate(legR);
    ctx.beginPath();
    ctx.roundRect(-3.5, 0, 7, 16, 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}
