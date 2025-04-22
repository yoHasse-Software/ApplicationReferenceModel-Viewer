

import type { Entity, RelationShip } from '$lib/types';
import { openDB, deleteDB, wrap, unwrap } from 'idb';


const DB_NAME = 'ea_viz_db';
const DB_VERSION = 1;
const DB_ENTETEIS = 'ea_viz_enteties';
const DB_RELATIONS = 'ea_viz_relations';


export const getEnteties = async () => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(DB_ENTETEIS, { keyPath: 'id' });
        },
    });

    const enteties = await db.getAll(DB_ENTETEIS);
    return enteties as Array<Entity>;
}

export const getRelations = async () => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(DB_RELATIONS, { keyPath: 'id' });
        },
    });

    const relations = await db.getAll(DB_RELATIONS);
    return relations as Array<RelationShip>;
}


export const addEnteties = async (enteties: Entity[]) => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(DB_ENTETEIS, { keyPath: 'id' });
        },
    });

    const tx = db.transaction(DB_ENTETEIS, 'readwrite');
    enteties.forEach((entety) => {
        tx.store.put(entety);
    });
    await tx.done;
}

export const addRelations = async (relations: RelationShip[]) => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(DB_RELATIONS, { keyPath: 'id' });
        },
    });

    const tx = db.transaction(DB_RELATIONS, 'readwrite');
    relations.forEach((relation) => {
        tx.store.put(relation);
    });
    await tx.done;
}



export const clearDB = async () => {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(DB_ENTETEIS, { keyPath: 'id' });
            db.createObjectStore(DB_RELATIONS, { keyPath: 'id' });
        },
    });

    await db.clear(DB_ENTETEIS);
    await db.clear(DB_RELATIONS);
}




