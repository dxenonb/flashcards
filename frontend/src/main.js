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

        this.frontCard = initFlashcardFront(() => {
            this.handleFlipFront();
        });
        this.rearCard = initFlashcardBack(
            (delayMs) => { this.handleRejectBack(Math.min(delayMs, 1000)); },
            (delayMs) => { this.handleAcceptBack(Math.min(delayMs, 1000)); },
        );

        this.el.appendChild(this.frontCard);
        this.el.appendChild(this.rearCard);

        this.rearCard.classList.add('hidden');

        this.handleBackTimeout = null;
    }

    handleFlipFront() {
        this.frontCard.classList.add('hidden');
        this.rearCard.classList.remove('hidden');
    }

    handleRejectBack(delay) {
        if (this.handleBackTimeout !== null) {
            clearTimeout(this.handleBackTimeout);
        }
        this.handleBackTimeout = setTimeout(() => {
            this.nextEntry();
        }, delay);
    }

    handleAcceptBack(delay) {
        if (this.handleBackTimeout !== null) {
            clearTimeout(this.handleBackTimeout);
        }
        this.handleBackTimeout = setTimeout(() => {
            this.nextEntry();
        }, delay);
    }

    nextEntry() {
        this.rearCard.classList.add('hidden');
        this.rearCard.classList.remove('left', 'right');

        this.frontCard.classList.remove('hidden');
    }

    destroy() {
        if (this.handleBackTimeout !== null) {
            clearTimeout(this.handleBackTimeout);
        }
    }
}

function renderTime(timerStart, timerSeconds) {
    const endTime = timerStart.valueOf() + timerSeconds * 1000;
    const rem = (endTime - new Date().valueOf()) / 1000;
    const minutesRem = Math.floor(rem / 60).toString().padStart(1, '0');
    const secondsRem = Math.floor(rem % 60).toString().padStart(2, '0');
    return `${minutesRem}:${secondsRem}`;
}

function renderFlashcard(cardEl) {

}

function initFlashcardFront(onFlipped) {
    const fullFlipPx = 150;
    const fullFlipThreshold = 0.75;
    const cardEl = document.createElement('div');
    cardEl.classList.add('flashcard');

    const span = document.createElement('span');
    cardEl.appendChild(span);

    let dragDownPx = 0;
    const handleMove = (event) => {
        if (dragging) {
            dragDownPx = event.pageY - originY;
            requestAnimationFrame(() => {
                const flip = Math.max(Math.min(dragDownPx / fullFlipPx, 1.0), -1.0);
                const flipAngle = flip * 180;
                cardEl.style.transform = `rotateX(${flipAngle}deg)`;
            });
        }
    };

    let dragging = false;
    let originY = 0;
    const startDrag = (event) => {
        dragging = true;
        originY = event.pageY;
        cardEl.classList.add('dragging');
        document.addEventListener('mousemove', handleMove);
    };
    cardEl.addEventListener('mousedown', startDrag);

    const stopDrag = () => {
        if (dragging) {
            dragging = false;

            const flip = Math.max(Math.min(dragDownPx / fullFlipPx, 1.0), -1.0);

            // check if the card was rejected or accepted
            if (flip < -fullFlipThreshold || flip > fullFlipThreshold) {
                if (onFlipped) {
                    onFlipped();
                }
            }

            dragDownPx = 0;
            cardEl.style.transform = `rotateX(0deg)`;
            cardEl.classList.remove('dragging');
            document.removeEventListener('mousemove', handleMove);
        }
    };
    document.addEventListener('mouseup', stopDrag);

    return cardEl;
}

function initFlashcardBack(onRejected, onAccepted) {
    const cardEl = document.createElement('div');
    cardEl.classList.add('flashcard');

    const span = document.createElement('span');
    cardEl.appendChild(span);

    const handleCb = (cb) => {
        // need to wait a cycle for transition info to become available
        // (due to the removal of the drag class)
        // TODO: this isn't perfect
        setTimeout(() => {
            const duration = extractTotalTransitionDuration(cardEl);
            cb(duration);
        }, 0);
    };

    let dragLeftPx = 0;
    let dragDownPx = 0;
    const handleMove = (event) => {
        if (dragging) {
            dragLeftPx = event.pageX - originX;
            dragDownPx = event.pageY - originY;
            requestAnimationFrame(() => {
                cardEl.style.transform = `translate(${dragLeftPx}px, ${dragDownPx}px)`;
            });
        }
    };

    let dragging = false;
    let originX = 0;
    let originY = 0;
    const startDrag = (event) => {
        dragging = true;
        originX = event.pageX;
        originY = event.pageY;
        cardEl.classList.add('dragging');
        document.addEventListener('mousemove', handleMove);
    };
    cardEl.addEventListener('mousedown', startDrag);

    const stopDrag = () => {
        if (dragging) {
            dragging = false;

            // check if the card was rejected or accepted
            if (dragLeftPx < -400) {
                cardEl.classList.add('left');
                if (onAccepted) {
                    handleCb(onAccepted);
                }
            } else if (dragLeftPx > 400) {
                cardEl.classList.add('right');
                if (onRejected) {
                    handleCb(onRejected);
                }
            }

            dragLeftPx = 0;
            dragDownPx = 0;
            cardEl.style.transform = `translate(0)`;
            cardEl.classList.remove('dragging');
            document.removeEventListener('mousemove', handleMove);
        }
    };
    document.addEventListener('mouseup', stopDrag);

    return cardEl;
}

/**
 * Returns the result in MS.
 * 
 * Currently assume duration/delay are specified in seconds.
 */
function extractTotalTransitionDuration(el) {
    // TODO: handle more general units (ms)
    const style = getComputedStyle(el);
    const duration = parseFloat(style.transitionDuration.replace('s', ''));
    const delay = parseFloat(style.transitionDelay.replace('s', ''));
    console.log('determined duration:', (duration + delay) * 1000);
    return (duration + delay) * 1000;
}

await russianTestSet();
new App();