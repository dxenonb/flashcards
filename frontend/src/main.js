import { russianTestSet } from "./modules/db.js";

class App {
    constructor() {
        this.timerStart = new Date();

        const timerSeconds = 10 * 60;
        new Round(document.querySelector('#round-page'));

        const renderTimeTick = () => {
            document.querySelector('#timer').textContent = renderTime(this.timerStart, timerSeconds);
        };
        setInterval(renderTimeTick, 1000);
    }
}

class Round {
    constructor(roundPageEl) {
        this.el = roundPageEl;

        this.el.appendChild(initFlashcard());
    }
}

function renderTime(timerStart, timerSeconds) {
    const endTime = timerStart.valueOf() + timerSeconds * 1000;
    const rem = (endTime - new Date().valueOf()) / 1000;
    const minutesRem = Math.floor(rem / 60).toString().padStart(1, '0');
    const secondsRem = Math.floor(rem % 60).toString().padStart(2, '0');
    return `${minutesRem}:${secondsRem}`;
}

// function renderFlashcard(cardEl) {

// }

function initFlashcard() {
    const cardEl = document.createElement('div');
    cardEl.classList.add('flashcard');

    const span = document.createElement('span');
    cardEl.appendChild(span);

    return cardEl;
}

await russianTestSet();
new App();