function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function safe(n, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}

export class Camera {
  /**
   * @param {number} viewWidth
   * @param {number} viewHeight
   */
  constructor(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.x = 0;
    this.y = 0;
  }

  /**
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} worldWidth
   * @param {number} worldHeight
   */
  follow(targetX, targetY, worldWidth, worldHeight) {
    const w = Math.max(0, safe(worldWidth, this.viewWidth));
    const h = Math.max(0, safe(worldHeight, this.viewHeight));
    const tx = safe(targetX, this.x + this.viewWidth / 2);
    const ty = safe(targetY, this.y + this.viewHeight / 2);
    const maxX = Math.max(0, w - this.viewWidth);
    const maxY = Math.max(0, h - this.viewHeight);
    this.x = clamp(tx - this.viewWidth / 2, 0, maxX);
    this.y = clamp(ty - this.viewHeight / 2, 0, maxY);
  }
}

