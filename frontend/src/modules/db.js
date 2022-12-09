import { openDB, deleteDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

const DB_NAME = 'flashcards';
const ENTRY_STORE = 'entry';
const CURRENT_VERSION = 202212000;

document.nanoidExposed = nanoid;

export class Entry {
    constructor(language, contents, translations) {
        this._id = nanoid(21);
        this._language = language;
        this._contents = contents;

        if (!translations) {
            this._translations = [];
        } else if (translations instanceof Array) {
            this._translations = translations;
        } else {
            this._translations = [translations];
        }

        this._partOfSpeech = null;
        // this._tags = [];
        // this._rootEntryId = null;
        this._synonyms = [];
        this._contexts = [];
        this._note = '';
        this._lastModified = new Date();
    }

    partOfSpeech(pos) {
        if (pos) {
            this._modify();
            this._partOfSpeech = pos;
            return this;
        } else {
            return this._partOfSpeech;
        }
    }

    addSynonym(synonym) {
        this._modify();
        this._synonyms.push(synonym);
        return this;
    }

    addContext(context, source) {
        if (!context || !source) {
            throw new Error('Context and source must not be null');
        }
        this._modify();
        this._contexts.push({
            context,
            source,
        });
        return this;
    }

    note(note) {
        if (note) {
            this._modify();
            this._note = note;
            return this;
        } else {
            return this._note;
        }
    }

    async commit(dbOrTx) {
        if (!dbOrTx) {
            throw new Error('Cannot commit object without a database or transaction instance');
        }
        const tx = entryTxRw(dbOrTx);
        const store = tx.objectStore(ENTRY_STORE);

        const obj = {
            id: this._id,
            language: this._language,
            contents: this._contents,
            translations: this._translations,
            partOfSpeech: this._partOfSpeech,
            synonyms: this._synonyms,
            contexts: this._contexts,
            note: this._note,
            lastModified: this._lastModified,
        };
        await store.put(obj);

        return this;
    }

    _modify() {
        this.lastModified = new Date();
    }
}

export async function initialize() {
    const db = await openDB(DB_NAME, CURRENT_VERSION, {
        upgrade(db, oldVersion, newVersion, tx, event) {
            if (oldVersion !== 0 || newVersion !== CURRENT_VERSION) {
                throw new Error('cannot upgrade database from unknown version', oldVersion);
            }

            db.createObjectStore(ENTRY_STORE, {
                keyPath: 'id',
            });
        },
    });
    return db;
}

export async function russianTestSet() {
    await deleteDB(DB_NAME);
    const db = await initialize();
    const tx = entryTxRw(db);

    let entry;

    entry = new Entry('ru', 'опять', ['again'])
        .partOfSpeech('adverb')
        .addSynonym('снова')
        .addContext('Я с тобой опять сегодня этой ночью', 'Чайф - Пусть всё будет так, как ты захочешь ')
        .note('can also mean again');
    await entry.commit(db);

    entry = new Entry('ru', 'снова', ['again'])
        .addSynonym('опять');
    await entry.commit(db);

    entry = new Entry('ru', 'цвет', ['color'])
        .addSynonym('noun');
    await entry.commit(db);

    return await tx.done;
}

function entryTxRw(dbOrTx) {
    if (dbOrTx instanceof IDBDatabase) {
        return dbOrTx.transaction([ENTRY_STORE], 'readwrite');
    } else {
        return dbOrTx;
    }
}
