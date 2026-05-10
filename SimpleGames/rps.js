/** @typedef {'scissors' | 'rock' | 'paper'} Choice */
/** @typedef {'win' | 'lose' | 'draw'} Outcome */

const EMOJIS = {
        scissors: "✌️",
        rock: "✊",
        paper: "✋",
};

const CHOICES = ["scissors", "rock", "paper"];

/** @param {Choice} player @param {Choice} computer */
const judge = (player, computer) => {
        if (player === computer) return "draw";
        if (
                (player === "scissors" && computer === "paper") ||
                (player === "rock" && computer === "scissors") ||
                (player === "paper" && computer === "rock")
        ) {
                return "win";
        }
        return "lose";
};

const randomChoice = () => CHOICES[Math.floor(Math.random() * CHOICES.length)];

const initialStats = () => ({ wins: 0, draws: 0, losses: 0 });

let stats = initialStats();

/** @type {number} */
let spinTimerId = 0;
let isSpinning = false;

const winsEl = document.getElementById("wins");
const drawsEl = document.getElementById("draws");
const lossesEl = document.getElementById("losses");
const resultPanel = document.getElementById("result-panel");
const resultPlayerEmoji = document.getElementById("result-player-emoji");
const resultComputerEmoji = document.getElementById("result-computer-emoji");
const resultOutcome = document.getElementById("result-outcome");
const resetBtn = document.getElementById("reset");

const renderStats = () => {
        winsEl.textContent = String(stats.wins);
        drawsEl.textContent = String(stats.draws);
        lossesEl.textContent = String(stats.losses);
};

const outcomeText = (/** @type {Outcome} */ outcome) => {
        if (outcome === "win") return "승리!";
        if (outcome === "lose") return "패배";
        return "무승부";
};

const outcomeClass = (/** @type {Outcome} */ outcome) => {
        if (outcome === "win") return "text-emerald-400";
        if (outcome === "lose") return "text-rose-400";
        return "text-amber-300";
};

const setChoiceButtonsDisabled = (/** @type {boolean} */ disabled) => {
        document.querySelectorAll(".choice-btn").forEach((btn) => {
                btn.disabled = disabled;
                btn.classList.toggle("opacity-50", disabled);
                btn.classList.toggle("pointer-events-none", disabled);
        });
};

const clearSpin = () => {
        if (spinTimerId) {
                window.clearTimeout(spinTimerId);
                spinTimerId = 0;
        }
        isSpinning = false;
        setChoiceButtonsDisabled(false);
        resultComputerEmoji.classList.remove("animate-pulse");
};

/**
 * @param {Choice} player
 * @param {Choice} computer
 * @param {Outcome} outcome
 */
const applyOutcome = (player, computer, outcome) => {
        resultComputerEmoji.textContent = EMOJIS[computer];
        resultComputerEmoji.classList.remove("animate-pulse");

        if (outcome === "win") stats.wins += 1;
        else if (outcome === "draw") stats.draws += 1;
        else stats.losses += 1;

        resultOutcome.textContent = outcomeText(outcome);
        resultOutcome.className = `mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl ${outcomeClass(outcome)}`;

        renderStats();
};

/**
 * 마지막 프레임이 `computer`가 되도록 시작 위치를 맞춤.
 * @param {Choice} computer
 * @param {number} steps
 */
const spinStartOffset = (computer, steps) => {
        const idxComputer = CHOICES.indexOf(computer);
        const k = steps - 1;
        return (((idxComputer - k) % 3) + 3) % 3;
};

/** @param {Choice} player */
const playRound = (player) => {
        if (isSpinning) return;

        const computer = randomChoice();
        const outcome = judge(player, computer);

        clearSpin();
        isSpinning = true;
        setChoiceButtonsDisabled(true);

        resultPanel.classList.remove("hidden");
        resultPlayerEmoji.textContent = EMOJIS[player];
        resultOutcome.textContent = "컴퓨터 선택 중…";
        resultOutcome.className = "mt-6 text-lg font-semibold tracking-tight text-slate-400 sm:text-xl";

        resultComputerEmoji.classList.add("animate-pulse");

        const steps = 10 + Math.floor(Math.random() * 6);
        const start = spinStartOffset(computer, steps);

        const stepDelay = (/** @type {number} */ stepIndex) => {
                const progress = stepIndex / Math.max(steps - 1, 1);
                const eased = progress * progress;
                return Math.round(38 + eased * 240);
        };

        const runStep = (/** @type {number} */ step) => {
                const choiceIdx = (start + step) % 3;
                const choice = CHOICES[choiceIdx];
                resultComputerEmoji.textContent = EMOJIS[choice];

                if (step >= steps - 1) {
                        spinTimerId = 0;
                        applyOutcome(player, computer, outcome);
                        isSpinning = false;
                        setChoiceButtonsDisabled(false);
                        return;
                }

                spinTimerId = window.setTimeout(() => runStep(step + 1), stepDelay(step + 1));
        };

        runStep(0);
};

document.querySelectorAll(".choice-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
                const choice = /** @type {Choice | undefined} */ (btn.getAttribute("data-choice"));
                if (choice && CHOICES.includes(choice)) playRound(choice);
        });
});

resetBtn.addEventListener("click", () => {
        clearSpin();
        stats = initialStats();
        renderStats();
        resultPanel.classList.add("hidden");
        resultPlayerEmoji.textContent = "";
        resultComputerEmoji.textContent = "";
        resultOutcome.textContent = "";
});

renderStats();
