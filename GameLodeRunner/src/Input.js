const KEYS = new Set();

/**
 * @param {HTMLElement} target
 */
export function attachKeyboard(target) {
  const down = (e) => {
    KEYS.add(e.code);
  };
  const up = (e) => {
    KEYS.delete(e.code);
  };
  const blur = () => KEYS.clear();

  target.addEventListener("keydown", down);
  target.addEventListener("keyup", up);
  window.addEventListener("blur", blur);

  return () => {
    target.removeEventListener("keydown", down);
    target.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    KEYS.clear();
  };
}

/** @param {string} code */
export function isKeyDown(code) {
  return KEYS.has(code);
}

/** @param {string} code */
export function consumeKeyPress(code) {
  if (!KEYS.has(code)) return false;
  KEYS.delete(code);
  return true;
}
