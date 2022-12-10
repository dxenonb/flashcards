import { Entry } from "./db.js";

export class EditScreen {
    constructor(db, editEntriesEl) {
        this.db = db;
        this.el = editEntriesEl;

        this.el.classList.remove('hidden');

        this.clickEntryHandler = (event) => {
            let node = event.target;
            while (node !== this.el && node.parentElement !== null) {
                const entryId = node.getAttribute('data-id');
                if (entryId) {
                    break;
                }
                node = node.parentElement;
            }

            const entryId = node.getAttribute('data-id');
            if (!entryId) {
                return;
            }
            this.editEntry(entryId);
        };
        this.el.querySelector('.entries-list-container').addEventListener('click', this.clickEntryHandler);
    }

    async editEntry(entryId) {
        const entry = await Entry.get(this.db, entryId);

        const formCtr = this.el.querySelector('.entries-form-container');
        if (!entry) {
            formCtr.classList.add('hidden');
            return;
        }
        formCtr.querySelector('#language').value = entry.language;
        formCtr.querySelector('#contents').value = entry.contents;
        formCtr.querySelector('#translations').value = entry.translations.join('\n');
        formCtr.querySelector('#part-of-speech').value = entry.partOfSpeech();
        formCtr.querySelector('#synonyms').value = entry.synonyms.join('\n');
        formCtr.querySelector('#contexts').value = entry.contexts.map((ctx) => `${ctx.context}\n${ctx.source}`).join('\n\n');
        formCtr.querySelector('#note').value = entry.note();
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
        this.el.removeEventListener('click', this.clickEntryHandler);
    }

}

function renderListItem(el, entry) {
    el.setAttribute('data-id', entry.id);

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