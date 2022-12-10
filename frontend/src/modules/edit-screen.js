import { Entry } from "./db.js";

export class EditScreen {
    constructor(db, editEntriesEl) {
        this.db = db;
        this.el = editEntriesEl;

        this.el.classList.remove('hidden');
    }

    async showEntryList() {
        const entries = await Entry.getAll(this.db);
        for (const entry of entries) {
            const el = initListItem();
            renderListItem(el, entry);
            this.el.querySelector('.entries-list').appendChild(el);
        }
    }

    destory() {
        this.el.classList.add('hidden');
    }

}

function renderListItem(el, entry) {
    el.querySelector('.language').textContent = entry.language;
    el.querySelector('.contents').textContent = entry.contents;
    el.querySelector('.translations').textContent = entry.translations;
}

function initListItem() {
    const el = document.createElement('li');

    const language = document.createElement('span');
    language.classList.add('language');
    const contents = document.createElement('span');
    contents.classList.add('contents');

    const translations = document.createElement('span');
    translations.classList.add('translations');
    const subline = document.createElement('div');
    subline.appendChild(translations);

    el.appendChild(language);
    el.appendChild(contents);
    el.appendChild(subline);

    return el;
}