import { GameObject } from "./GameObject.js";
import { TILE_SIZE } from "./TileMap.js";

const VISUAL_SCALE = 0.82;

const ANIM = {
  IDLE: "idle",
  WALK: "walk",
  CLIMB: "climb",
  FALL: "fall",
  TRAPPED: "trapped",
};

/**
 * @param {import("./TileMap.js").TileMap} map
 * @param {number} col
 * @param {number} row
 */
function movementOptions(map, col, row) {
  const onLadder = map.isLadder(col, row);
  const onRope = map.isRope(col, row);
  const belowSolid = map.isSolid(col, row + 1);
  const supported = belowSolid || onLadder;

  if (!supported && !onLadder && !onRope && !map.isSolid(col, row + 1)) {
    return [{ col, row: row + 1, mode: "gravity" }];
  }

  /** @type {{col:number,row:number,mode:string}[]} */
  const next = [];
  if ((onLadder || map.isLadder(col, row - 1)) && !map.isSolid(col, row - 1)) {
    next.push({ col, row: row - 1, mode: "ladder" });
  }
  if ((onLadder || map.isLadder(col, row + 1)) && !map.isSolid(col, row + 1)) {
    next.push({ col, row: row + 1, mode: "ladder" });
  }
  const canMoveH = supported || onLadder || onRope;
  if (canMoveH && !map.isSolid(col - 1, row)) next.push({ col: col - 1, row, mode: "walk" });
  if (canMoveH && !map.isSolid(col + 1, row)) next.push({ col: col + 1, row, mode: "walk" });
  return next;
}

function key(col, row) {
  return `${col},${row}`;
}

export class Guard extends GameObject {
  /**
   * @param {number} col
   * @param {number} row
   * @param {{ speed:number, intelligence:number, vision:number, color:string }} stats
   */
  constructor(col, row, stats) {
    super(col * TILE_SIZE, row * TILE_SIZE);
    this.col = col;
    this.row = row;
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = this.x;
    this.toY = this.y;
    this.moving = false;
    this.moveT = 0;
    this.moveDuration = stats.speed;
    this.moveMode = "walk";
    this.patrolDir = -1;
    this.intelligence = stats.intelligence;
    this.vision = stats.vision;
    this.color = stats.color;
    this.animState = ANIM.IDLE;
    this.animTime = 0;
    this.trappedTimer = 0;
    this.pathCooldown = 0;
    this.facing = -1;
  }

  get centerX() {
    return this.x + TILE_SIZE / 2;
  }

  get centerY() {
    return this.y + TILE_SIZE / 2;
  }

  /**
   * @param {number} dt
   * @param {import("./TileMap.js").TileMap} map
   * @param {{ col:number, row:number }} playerCell
   */
  updateAI(dt, map, playerCell) {
    this.animTime += dt;
    if (this.trappedTimer > 0) {
      this.trappedTimer -= dt;
      this.animState = ANIM.TRAPPED;
      if (this.trappedTimer <= 0 && !map.isSolid(this.col, this.row - 1)) {
        this.tryMove(map, this.col, this.row - 1, "ladder");
      }
      return;
    }

    if (map.isHole(this.col, this.row)) {
      this.trappedTimer = 10;
      this.animState = ANIM.TRAPPED;
      this.moving = false;
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
      }
      this.animState = this.moveMode === "gravity" ? ANIM.FALL : this.moveMode === "ladder" ? ANIM.CLIMB : ANIM.WALK;
      return;
    }

    const dist = Math.abs(playerCell.col - this.col) + Math.abs(playerCell.row - this.row);
    // 플레이어를 놓치지 않도록 기본 추격 모드 유지
    const chasing = true;

    if (chasing) {
      this.pathCooldown -= dt;
      if (this.pathCooldown <= 0) {
        this.pathCooldown = 0.6 - this.intelligence * 0.18;
        const step = this.pickChaseStep(map, playerCell.col, playerCell.row);
        if (step) {
          this.tryMove(map, step.col, step.row, step.mode);
          return;
        }
        // 경로를 완전히 못 찾더라도, 추격 중에는 상하 이동(사다리) 우선 휴리스틱 적용
        const opts = movementOptions(map, this.col, this.row);
        if (opts.length) {
          const best = opts.reduce((acc, cur) => {
            const d = Math.abs(playerCell.col - cur.col) + Math.abs(playerCell.row - cur.row);
            const verticalNeed = Math.abs(playerCell.row - this.row) > 0;
            const ladderBonus = cur.mode === "ladder" && verticalNeed ? -1.25 : 0;
            const gravityPenalty = cur.mode === "gravity" ? 0.6 : 0;
            const score = d + gravityPenalty + ladderBonus;
            if (!acc || score < acc.score) return { step: cur, score };
            return acc;
          }, null);
          if (best?.step) {
            this.tryMove(map, best.step.col, best.step.row, best.step.mode);
            return;
          }
        }
      }
    }

    const patrolTargetCol = this.col + this.patrolDir;
    const opts = movementOptions(map, this.col, this.row);
    const patrolStep = opts.find((v) => v.col === patrolTargetCol && v.row === this.row);
    if (patrolStep) {
      this.tryMove(map, patrolStep.col, patrolStep.row, patrolStep.mode);
    } else {
      this.patrolDir *= -1;
      const retry = opts.find((v) => v.col === this.col + this.patrolDir && v.row === this.row);
      if (retry) this.tryMove(map, retry.col, retry.row, retry.mode);
      else {
        const gravity = opts.find((v) => v.mode === "gravity" || v.mode === "ladder");
        if (gravity) this.tryMove(map, gravity.col, gravity.row, gravity.mode);
        else this.animState = ANIM.IDLE;
      }
    }
  }

  /**
   * @param {import("./TileMap.js").TileMap} map
   * @param {number} targetCol
   * @param {number} targetRow
   */
  pickChaseStep(map, targetCol, targetRow) {
    const start = { col: this.col, row: this.row };
    const q = [start];
    const visited = new Set([key(start.col, start.row)]);
    /** @type {Map<string, {col:number,row:number,mode:string,parent:string|null}>} */
    const parent = new Map();
    parent.set(key(start.col, start.row), { col: start.col, row: start.row, mode: "walk", parent: null });
    const maxNodes = map.cols * map.rows;
    let explored = 0;
    let bestKey = key(start.col, start.row);
    let bestDist = Math.abs(targetCol - start.col) + Math.abs(targetRow - start.row);

    while (q.length && explored < maxNodes) {
      explored += 1;
      const cur = q.shift();
      if (!cur) break;
      const curDist = Math.abs(targetCol - cur.col) + Math.abs(targetRow - cur.row);
      if (curDist < bestDist) {
        bestDist = curDist;
        bestKey = key(cur.col, cur.row);
      }
      if (cur.col === targetCol && cur.row === targetRow) break;
      for (const n of movementOptions(map, cur.col, cur.row)) {
        if (!map.inBounds(n.col, n.row)) continue;
        const k = key(n.col, n.row);
        if (visited.has(k)) continue;
        visited.add(k);
        parent.set(k, { col: n.col, row: n.row, mode: n.mode, parent: key(cur.col, cur.row) });
        q.push({ col: n.col, row: n.row });
      }
    }

    const targetKey = key(targetCol, targetRow);
    const routeKey = parent.has(targetKey) ? targetKey : bestKey;
    if (!parent.has(routeKey)) return null;
    let cur = routeKey;
    let prev = parent.get(cur);
    while (prev && prev.parent && prev.parent !== key(this.col, this.row)) {
      cur = prev.parent;
      prev = parent.get(cur);
    }
    if (!prev) return null;
    if (prev.parent === key(this.col, this.row)) return prev;
    return null;
  }

  /**
   * @param {import("./TileMap.js").TileMap} map
   * @param {number} col
   * @param {number} row
   * @param {string} mode
   */
  tryMove(map, col, row, mode) {
    if (!map.inBounds(col, row) || map.isSolid(col, row)) return;
    if (col < this.col) this.facing = -1;
    else if (col > this.col) this.facing = 1;
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = col * TILE_SIZE;
    this.toY = row * TILE_SIZE;
    this.moveMode = mode;
    this.moveT = 0;
    this.moving = true;
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
    ctx.strokeStyle = "#1b1f24";
    ctx.lineWidth = 2;
    ctx.fillStyle = this.color;

    // 머리
    ctx.fillRect(-6, -20, 12, 12);

    // 몸통
    ctx.fillRect(-10, -12, 20, 20);

    // 팔
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

    // 다리
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
