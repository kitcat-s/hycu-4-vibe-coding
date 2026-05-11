/**
 * 모든 게임 오브젝트의 기본 클래스
 */
export class GameObject {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    /** @type {number} */
    this.vx = 0;
    /** @type {number} */
    this.vy = 0;
    this.markedForRemoval = false;
  }

  /** @param {number} _dt 초 단위 */
  update(_dt) {}

  /** @param {CanvasRenderingContext2D} _ctx */
  render(_ctx) {}
}
