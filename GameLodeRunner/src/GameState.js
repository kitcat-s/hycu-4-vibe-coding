/** @typedef {'menu' | 'playing' | 'gameover'} GameStateId */

export const GameState = {
  MENU: /** @type {const} */ ("menu"),
  PLAYING: /** @type {const} */ ("playing"),
  GAME_OVER: /** @type {const} */ ("gameover"),
};

/** @param {GameStateId} state */
export function gameStateLabel(state) {
  switch (state) {
    case GameState.MENU:
      return "메뉴";
    case GameState.PLAYING:
      return "게임 중";
    case GameState.GAME_OVER:
      return "게임 오버";
    default:
      return String(state);
  }
}
