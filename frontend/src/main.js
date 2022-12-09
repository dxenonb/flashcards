import { russianTestSet } from "./modules/db.js";

class App {
    constructor() {
        this.timerStart = new Date();

        const timerSeconds = 10 * 60;

        setInterval(() => {
            document.querySelector('#timer').textContent = renderTime(this.timerStart, timerSeconds);
        }, 1000);
    }
}

function renderTime(timerStart, timerSeconds) {
    const endTime = timerStart.valueOf() + timerSeconds * 1000;
    const rem = (endTime - new Date().valueOf()) / 1000;
    const minutesRem = Math.floor(rem / 60).toString().padStart(1, '0');
    const secondsRem = Math.floor(rem % 60).toString().padStart(2, '0');
    return `${minutesRem}:${secondsRem}`;
}

await russianTestSet();
new App();