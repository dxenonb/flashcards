import { Entry, ENTRY_STORE } from "./db.js";

const SAVE_TIMEOUT = 1 * 1000;

export class EditScreen {
    constructor(db, editEntriesEl) {
        this.db = db;
        this.el = editEntriesEl;

        this.el.classList.remove('hidden');

        const listCtr = this.el.querySelector('.entries-list-container');

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
        listCtr.addEventListener('click', this.clickEntryHandler);

        const formCtr = this.el.querySelector('.entries-form-container');
        this.saveTimeout = null;
        this.editEntryHandler = (event) => this.handleEditEntry(event);
        formCtr.addEventListener('input', this.editEntryHandler);
    }

    handleEditEntry() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.el.querySelector('#save-status').textContent = 'saving...';
        this.saveTimeout = setTimeout(async () => {
            this.saveTimeout = null;
            const formCtr = this.el.querySelector('.entries-form-container');
            const entryId = formCtr.getAttribute('data-id');

            const tx = this.db.transaction([ENTRY_STORE], 'readwrite');

            let entry;
            try {
                entry = await this.saveEntryNow(tx, entryId);
                if (!entry) {
                    return;
                }
            } catch (e) {
                console.error('save error:', e);
                this.el.querySelector('#save-status').textContent = 'error: fix formatting issues';
                return;
            }

            this.el.querySelector('#save-status').textContent = 'saved';
            this.updateEntryList(entry);

            await tx.done;
        }, SAVE_TIMEOUT);
    }

    async saveEntryNow(tx, entryId) {
        let promise;
        this.saveTimeoutPromise = promise = Entry.get(tx, entryId);

        const entry = await promise;
        if (this.saveTimeoutPromise !== promise) {
            return null;
        }

        this.readEntry(entry);
        return entry.commit(tx);
    }

    readEntry(entry) {
        // TODO: more getters and setters
        const formCtr = this.el.querySelector('.entries-form-container');
        entry._language = formCtr.querySelector('#language').value;
        entry._contents = formCtr.querySelector('#contents').value;

        entry._translations = [];
        for (const translation of formCtr.querySelector('#translations').value.split('\n')) {
            entry.translations.push(translation.trim());
        }

        entry._partOfSpeech = formCtr.querySelector('#part-of-speech').value;

        entry._synonyms = [];
        for (const syn of formCtr.querySelector('#synonyms').value.split('\n')) {
            entry.addSynonym(syn.trim());
        }

        entry._contexts = [];
        for (const ctxPair of formCtr.querySelector('#contexts').value.split('\n\n')) {
            if (!ctxPair) {
                break;
            }
            const [ctx, src] = ctxPair.split('\n');
            entry.addContext(ctx.trim(), src.trim());
        }

        entry._note = formCtr.querySelector('#note').value;
    }

    async editEntry(entryId) {
        if (this.saveTimeout) {
            alert('save in progress - wait a second');
            return;
        }

        const entry = await Entry.get(this.db, entryId);

        const formCtr = this.el.querySelector('.entries-form-container');
        if (!entry) {
            formCtr.classList.add('hidden');
            return;
        } else {
            formCtr.classList.remove('hidden');
        }
        formCtr.setAttribute('data-id', entryId);
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

    updateEntryList(entry) {
        const listEl = this.el.querySelector('.entries-list');
        for (const child of listEl.children) {
            if (child.getAttribute('data-id') === entry.id) {
                renderListItem(child, entry);
            }
        }
    }

    destory() {
        this.el.classList.add('hidden');
        this.el.querySelector('.entries-list-container').removeEventListener('click', this.clickEntryHandler);
        this.el.querySelector('.entries-form-container').removeEventListener('input', this.editEntryHandler);
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