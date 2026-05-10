const GRID_SIZE = 16;
const PAIR_COUNT = GRID_SIZE / 2;

const SYMBOLS = ["🐶", "🐱", "🦁", "🐸", "🐼", "🐨", "🦊", "🐰"];

const shuffle = (items) => {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
};

const buildDeck = () => shuffle(SYMBOLS.slice(0, PAIR_COUNT).flatMap((s) => [s, s]));

const initialState = () => ({
        symbols: buildDeck(),
        matched: new Set(),
        flipped: [],
        moves: 0,
        lock: false,
});

let state = initialState();

const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const restartBtn = document.getElementById("restart");
const winBanner = document.getElementById("win-banner");
const winMovesEl = document.getElementById("win-moves");
const winCloseBtn = document.getElementById("win-close");

const setMovesDisplay = (n) => {
        movesEl.textContent = String(n);
};

const showWin = () => {
        winMovesEl.textContent = String(state.moves);
        winBanner.classList.remove("hidden");
        winBanner.classList.add("flex");
};

const hideWin = () => {
        winBanner.classList.add("hidden");
        winBanner.classList.remove("flex");
};

const allMatched = () => state.matched.size === GRID_SIZE;

const updateCardDom = (index) => {
        const scene = boardEl.querySelector(`[data-index="${index}"]`);
        const inner = scene?.querySelector(".card-inner");
        const btn = scene?.querySelector("button");
        if (!inner || !btn) return;
        const flipped = state.flipped.includes(index);
        const matched = state.matched.has(index);
        inner.classList.toggle("is-flipped", flipped || matched);
        inner.setAttribute("aria-pressed", flipped || matched ? "true" : "false");
        btn.disabled = matched;
        btn.setAttribute("aria-label", matched ? "맞춘 카드" : "카드 뒤집기");
};

const renderBoard = () => {
        boardEl.innerHTML = "";
        state.symbols.forEach((symbol, index) => {
                const scene = document.createElement("div");
                scene.className = "card-scene aspect-square";
                scene.dataset.index = String(index);

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className =
                        "relative h-full w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-default";
                btn.dataset.index = String(index);
                btn.setAttribute("aria-label", "카드 뒤집기");

                const inner = document.createElement("div");
                inner.className = "card-inner relative h-full w-full rounded-xl shadow-md";
                inner.dataset.index = String(index);

                const front = document.createElement("div");
                front.className =
                        "card-face absolute inset-0 flex items-center justify-center rounded-xl border-2 border-blue-700 bg-gradient-to-br from-blue-500 to-blue-700 text-3xl shadow-inner sm:text-4xl";
                front.setAttribute("aria-hidden", "true");
                front.textContent = "?";

                const back = document.createElement("div");
                back.className =
                        "card-face card-back absolute inset-0 flex items-center justify-center rounded-xl border-2 border-blue-800 bg-gradient-to-br from-blue-900 to-slate-900 text-3xl sm:text-4xl";
                back.setAttribute("aria-hidden", "true");
                back.textContent = symbol;

                inner.append(front, back);
                btn.appendChild(inner);
                scene.appendChild(btn);
                boardEl.appendChild(scene);

                btn.addEventListener("click", () => onCardClick(index));
        });

        setMovesDisplay(state.moves);
        state.symbols.forEach((_, i) => updateCardDom(i));
};

const onCardClick = (index) => {
        if (state.lock) return;
        if (state.matched.has(index)) return;
        if (state.flipped.includes(index)) return;

        state.flipped.push(index);
        updateCardDom(index);

        if (state.flipped.length < 2) return;

        state.moves += 1;
        setMovesDisplay(state.moves);
        state.lock = true;

        const [a, b] = state.flipped;
        const match = state.symbols[a] === state.symbols[b];

        if (match) {
                state.matched.add(a);
                state.matched.add(b);
                state.flipped = [];
                state.lock = false;
                updateCardDom(a);
                updateCardDom(b);
                if (allMatched()) showWin();
                return;
        }

        window.setTimeout(() => {
                state.flipped = [];
                updateCardDom(a);
                updateCardDom(b);
                state.lock = false;
        }, 700);
};

const restart = () => {
        hideWin();
        state = initialState();
        renderBoard();
};

restartBtn.addEventListener("click", restart);
winCloseBtn.addEventListener("click", () => {
        hideWin();
        restart();
});

renderBoard();
