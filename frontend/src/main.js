import { Entry, initialize } from "./modules/db.js";
import { EditScreen } from './modules/edit-screen.js';
import { Round } from './modules/round.js';

class App {
    constructor(db) {
        this.db = db;

        const toggleModeEl = document.querySelector('#toggle-mode');

        toggleModeEl.addEventListener('click', (event) => {
            event.preventDefault();
            this.page.destroy();

            if (this.page instanceof Round) {
                this.editScreen();
            } else {
                this.startRound();
            }
        });
    }

    async editScreen() {
        const screen = new EditScreen(this.db, document.querySelector('#entries-page'));
        this.page = screen;
        await screen.showEntryList();
    }

    async startRound() {
        const entries = await Entry.getAll(this.db);
        shuffle(entries);

        this.page = new Round(
            document.querySelector('#timer'),
            document.querySelector('#round-page'),
            10 * 60,
            entries,
        );
    }
}

function shuffle(array) {
    // https://stackoverflow.com/a/2450976
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

// expose handy delete method
document.deleteDb = () => {
    return deleteDB(DB_NAME);
};

const db = await initialize();

let app;
document.flashcardApp = app = new App(db);

await app.startRound();
// await app.editScreen();