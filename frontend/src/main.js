import { initialize, russianTestSet } from "./modules/db.js";
import { EditScreen } from './modules/edit-screen.js';

class App {
    constructor(db) {
        this.db = db;
    }

    async editScreen() {
        const screen = new EditScreen(this.db, document.querySelector('#entries-page'));
        await screen.showEntryList();
    }

    async startRound() {
        // const entries = await Entry.getAll(this.db);
        // 
        // new Round(
        //     document.querySelector('#timer'),
        //     document.querySelector('#round-page'),
        //     10 * 60,
        //     entries,
        // );
    }
}

class Round {
    constructor(timerEl, roundPageEl, roundDurationSeconds, entries) {
        this.el = roundPageEl;
        // TODO: need to empty the element

        this.entries = entries;
        this.index = 0;

        this.handleBackTimeout = null;

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

        this.timerStart = new Date();
        this.roundDuration = roundDurationSeconds;
        const renderTimeTick = () => {
            timerEl.textContent = renderTime(this.timerStart, this.roundDuration);
        };
        renderTimeTick();
        this.timerInterval = setInterval(renderTimeTick, 1000);

        this.renderCardFront();
    }

    renderCardFront() {
        const entry = this.entries[this.index];
        this.frontCard.setAttribute('lang', entry.language);
        this.frontCard.querySelector('span').textContent = entry.contents;
    }

    renderCardBack() {
        const entry = this.entries[this.index];
        // TODO: oops - need to store translation language
        this.rearCard.setAttribute('lang', 'en');
        // TODO: need to format this locale-appropriate
        this.rearCard.querySelector('span').textContent = entry.translations.join(', ');
    }

    handleFlipFront() {
        this.frontCard.classList.add('hidden');
        this.rearCard.classList.remove('hidden');

        this.renderCardBack();
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
        this.index = (this.index + 1) % this.entries.length;

        this.rearCard.classList.add('hidden');
        this.rearCard.classList.remove('left', 'right');

        this.frontCard.classList.remove('hidden');

        this.renderCardFront();
    }

    destroy() {
        if (this.handleBackTimeout !== null) {
            clearTimeout(this.handleBackTimeout);
        }
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
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
            dragDownPx = pageY(event) - originY;
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
        originY = pageY(event);
        cardEl.classList.add('dragging');
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
    };
    cardEl.addEventListener('mousedown', startDrag);
    cardEl.addEventListener('touchstart', startDrag);

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
            document.removeEventListener('touchmove', handleMove);
        }
    };
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

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
            dragLeftPx = pageX(event) - originX;
            dragDownPx = pageY(event) - originY;
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
        originX = pageX(event);
        originY = pageY(event);
        cardEl.classList.add('dragging');
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove);
    };
    cardEl.addEventListener('mousedown', startDrag);
    cardEl.addEventListener('touchstart', startDrag);

    const stopDrag = () => {
        if (dragging) {
            dragging = false;

            // check if the card was rejected or accepted
            if (dragLeftPx < -100) {
                cardEl.classList.add('left');
                if (onAccepted) {
                    handleCb(onAccepted);
                }
            } else if (dragLeftPx > 100) {
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
            document.removeEventListener('touchmove', handleMove);
        }
    };
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    return cardEl;
}

function pageX(event) {
    if (event.type.toLowerCase().startsWith('mouse')) {
        return event.pageX;
    } else {
        return event.touches[0].pageX;
    }
}

function pageY(event) {
    if (event.type.toLowerCase().startsWith('mouse')) {
        return event.pageY;
    } else {
        return event.touches[0].pageY;
    }
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
    return (duration + delay) * 1000;
}

await russianTestSet();
const db = await initialize();

let app;
document.flashcardApp = app = new App(db);

// await app.startRound();
await app.editScreen();