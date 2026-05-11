/**
 * Web Audio 기반 짧은 효과음 (외부 파일 없음)
 */
export function createAudioManager() {
  /** @type {AudioContext | null} */
  let ctx = null;

  function ensureContext() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  /** @param {number} freq @param {number} dur @param {'sine'|'square'} type */
  function beep(freq, dur, type = "sine") {
    const c = ensureContext();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    resumeFromUserGesture() {
      void ensureContext();
    },
    playJump() {
      beep(320, 0.06, "square");
    },
    playCollect() {
      beep(660, 0.05);
      setTimeout(() => beep(880, 0.08), 40);
    },
    playHit() {
      beep(120, 0.15, "square");
    },
    playMenuSelect() {
      beep(440, 0.07);
    },
  };
}
