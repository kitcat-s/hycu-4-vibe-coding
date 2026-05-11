/** RAF는 보통 디스플레이 주사율(예: 60Hz)에 맞춰 호출됨 */
const MAX_DT = 0.1;

/**
 * @typedef {{ update: (dt: number) => void, render: () => void }} LoopClient
 */

/**
 * requestAnimationFrame 기반 루프. update/render 분리, 초 단위 델타 타임.
 * @param {LoopClient} client
 */
export function createGameLoop(client) {
  let raf = 0;
  /** @type {number | null} */
  let last = null;
  let running = false;

  const tick = (now) => {
    if (!running) return;
    if (last === null) {
      last = now;
      raf = requestAnimationFrame(tick);
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > MAX_DT) dt = MAX_DT;

    client.update(dt);
    client.render();
    raf = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = null;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
