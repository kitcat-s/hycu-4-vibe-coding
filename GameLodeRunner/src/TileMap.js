export const TILE_SIZE = 32;
export const MAP_COLS = 28;
export const MAP_ROWS = 16;

const TILE = {
  EMPTY: ".",
  BRICK: "B",
  CONCRETE: "C",
  LADDER: "L",
  ROPE: "R",
};

const TEST_MAP_ROWS = [
  "............................",
  "............................",
  "....RRRRRL..G...............",
  "...BBBBBBLBBBBBB............",
  ".........L..................",
  ".........L..................",
  "..G......L......E...........",
  ".BBBBBBBBLBBBBBBBBBBBB......",
  "....RRRRRL....RRRR..........",
  ".........L..................",
  ".........L..................",
  "..BBBBBBBLBBBBBBBBBBBB......",
  "...RRRR..L..RRRR............",
  ".........L..G...............",
  "CCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  "............................",
];

/**
 * @typedef {{ col: number, row: number }} Cell
 */

export class TileMap {
  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.width = this.cols * TILE_SIZE;
    this.height = this.rows * TILE_SIZE;

    /** @type {string[][]} */
    this.tiles = [];
    /** @type {Set<string>} */
    this.golds = new Set();
    /** @type {Cell} */
    this.exit = { col: 18, row: 5 };
    /** @type {Map<string, number>} */
    this.holes = new Map();

    this._parse(TEST_MAP_ROWS);
  }

  /** @param {string[]} rows */
  _parse(rows) {
    this.tiles = rows.map((line, row) =>
      line.split("").map((ch, col) => {
        if (ch === "G") {
          this.golds.add(`${col},${row}`);
          return TILE.EMPTY;
        }
        if (ch === "E") {
          this.exit = { col, row };
          return TILE.EMPTY;
        }
        return ch;
      }),
    );
  }

  /** @param {number} col @param {number} row */
  inBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  /** @param {number} col @param {number} row */
  tileAt(col, row) {
    if (!this.inBounds(col, row)) return TILE.CONCRETE;
    return this.tiles[row][col];
  }

  /** @param {number} col @param {number} row */
  isSolid(col, row) {
    const t = this.tileAt(col, row);
    if (t === TILE.BRICK && this.isHole(col, row)) return false;
    return t === TILE.BRICK || t === TILE.CONCRETE;
  }

  /** @param {number} col @param {number} row */
  isLadder(col, row) {
    return this.tileAt(col, row) === TILE.LADDER;
  }

  /** @param {number} col @param {number} row */
  isRope(col, row) {
    return this.tileAt(col, row) === TILE.ROPE;
  }

  /** @param {number} col @param {number} row */
  collectGold(col, row) {
    const key = `${col},${row}`;
    if (!this.golds.has(key)) return false;
    this.golds.delete(key);
    return true;
  }

  /** @param {number} col @param {number} row */
  isExit(col, row) {
    return this.exit.col === col && this.exit.row === row;
  }

  /** @param {number} col @param {number} row */
  isHole(col, row) {
    return this.holes.has(`${col},${row}`);
  }

  /** @param {number} col @param {number} row */
  canDrill(col, row) {
    if (!this.inBounds(col, row)) return false;
    const t = this.tileAt(col, row);
    return t === TILE.BRICK && !this.isHole(col, row);
  }

  /**
   * @param {number} col
   * @param {number} row
   * @param {number} durationSec
   */
  drill(col, row, durationSec = 15) {
    if (!this.canDrill(col, row)) return false;
    this.holes.set(`${col},${row}`, durationSec);
    return true;
  }

  /** @param {number} dt */
  update(dt) {
    for (const [key, timeLeft] of this.holes.entries()) {
      const next = timeLeft - dt;
      if (next <= 0) this.holes.delete(key);
      else this.holes.set(key, next);
    }
  }

  get exitActive() {
    return this.goldRemaining === 0;
  }

  get goldRemaining() {
    return this.golds.size;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 배경
    ctx.fillStyle = "#040404";
    ctx.fillRect(0, 0, this.width, this.height);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const t = this.tileAt(col, row);

        if (t === TILE.BRICK && !this.isHole(col, row)) {
          ctx.fillStyle = "#7a4f2a";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#5f3b1f";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          ctx.strokeStyle = "#91633a";
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 10);
          ctx.lineTo(x + TILE_SIZE - 4, y + 10);
          ctx.moveTo(x + 4, y + 22);
          ctx.lineTo(x + TILE_SIZE - 4, y + 22);
          ctx.stroke();
        } else if (t === TILE.CONCRETE) {
          ctx.fillStyle = "#6d7279";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#575c63";
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          ctx.fillStyle = "#80858b";
          ctx.fillRect(x + 6, y + 8, 3, 3);
          ctx.fillRect(x + 20, y + 6, 4, 4);
          ctx.fillRect(x + 16, y + 20, 3, 3);
        } else if (t === TILE.LADDER) {
          ctx.strokeStyle = "#8b5a2b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 2);
          ctx.lineTo(x + 10, y + TILE_SIZE - 2);
          ctx.moveTo(x + TILE_SIZE - 10, y + 2);
          ctx.lineTo(x + TILE_SIZE - 10, y + TILE_SIZE - 2);
          ctx.stroke();
          ctx.strokeStyle = "#b07942";
          ctx.lineWidth = 2;
          for (let k = 7; k < TILE_SIZE; k += 8) {
            ctx.beginPath();
            ctx.moveTo(x + 10, y + k);
            ctx.lineTo(x + TILE_SIZE - 10, y + k);
            ctx.stroke();
          }
        } else if (t === TILE.ROPE) {
          ctx.strokeStyle = "#9a6a3b";
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(x + 1, y + TILE_SIZE / 2);
          ctx.lineTo(x + TILE_SIZE - 1, y + TILE_SIZE / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (this.isHole(col, row)) {
          ctx.fillStyle = "#050505";
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = "#303030";
          ctx.strokeRect(x + 2.5, y + 2.5, TILE_SIZE - 5, TILE_SIZE - 5);
        }
      }
    }

    // 금괴
    for (const key of this.golds) {
      const [col, row] = key.split(",").map(Number);
      const x = col * TILE_SIZE + 6;
      const y = row * TILE_SIZE + 10;
      const w = TILE_SIZE - 12;
      const h = 12;
      ctx.fillStyle = "#d9a21b";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#7a5a12";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = "#f5cf4f";
      ctx.fillRect(x + 3, y + 2, w - 6, 3);
      ctx.fillStyle = "#b98514";
      ctx.fillRect(x + 2, y + h - 3, w - 4, 2);
    }

    // 출구
    const ex = this.exit.col * TILE_SIZE;
    const ey = this.exit.row * TILE_SIZE;
    ctx.fillStyle = this.exitActive ? "#3fa34d" : "#646b72";
    ctx.fillRect(ex + 8, ey + 6, 16, 22);
    ctx.strokeStyle = this.exitActive ? "#245e2d" : "#454b51";
    ctx.lineWidth = 2;
    ctx.strokeRect(ex + 8, ey + 6, 16, 22);
    ctx.fillStyle = this.exitActive ? "#b5f5be" : "#adb5bd";
    ctx.beginPath();
    ctx.arc(ex + 20, ey + 17, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
