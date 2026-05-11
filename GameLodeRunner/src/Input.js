const KEYS = new Set();

/**
 * @param {HTMLElement} target
 */
export function attachKeyboard(target) {
  const movementKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "Space",
  ]);

  const down = (e) => {
    if (movementKeys.has(e.code)) e.preventDefault();
    KEYS.add(e.code);
  };
  const up = (e) => {
    if (movementKeys.has(e.code)) e.preventDefault();
    KEYS.delete(e.code);
  };
  const blur = () => KEYS.clear();

  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);

  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
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
