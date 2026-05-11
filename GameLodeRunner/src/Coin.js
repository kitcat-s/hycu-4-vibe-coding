import { GameObject } from "./GameObject.js";

export class Coin extends GameObject {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super(x, y);
    this.radius = 14;
    this.phase = Math.random() * Math.PI * 2;
    /** @type {number} */
    this.bobOffset = 0;
  }

  /** @param {number} dt */
  update(dt) {
    this.phase += dt * 4;
    this.bobOffset = Math.sin(this.phase) * 4;
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    const x = this.x;
    const y = this.y + this.bobOffset;
    const r = this.radius;

    ctx.save();
    ctx.fillStyle = "#f0883e";
    ctx.strokeStyle = "#ffa657";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd866";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", x, y + 1);
    ctx.restore();
  }
}
