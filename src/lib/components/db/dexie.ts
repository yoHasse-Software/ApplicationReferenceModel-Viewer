import Dexie, { type EntityTable, type BulkError, type Collection } from "dexie";
import type { BoxModel, DiagramTypes, GraphData, RuleOperator, TitleModel } from "$lib/types";
import { localStore } from "../localStore.svelte";

export const defaultDbName = 'default-nodata';
const dbVersion = 1;


export interface Entity {
    id: string;
    name: string;
    label: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}
export interface RelationShip {
    id: string;
    from: string;
    label: string;
    type: "<->" | "->" | "<-";
    to: string;
    metadata: {
        [key: string]: string | number | boolean;
    };
}

export interface ConditionalFormatting { 
    id: string;
    name: string;
    label: string; 
    value: string; 
    metadataKey: string;
    operator: RuleOperator;
    styling: {
        backgroundColor: {
            isSet: boolean;
            color?: string;
        };
        color: {
            isSet: boolean;
            color?: string;
        };
        borderColor: {
            isSet: boolean;
            color?: string;
        };
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'line-through';
        content?: string;
    }
}

export interface DiagramOptions {
    diagramType: DiagramTypes;
    labelHierarchy: string[];
    hierarchyRelMod: string[];
    visibleLabels: string[];
    displayEmpty: boolean;
    rootAtLabel?: string;
    boxModel?: BoxModel;
    titleModel?: TitleModel;
    rootColumns?: number;
    diameter?: number;
    maxDepth?: number;
    columnsPerLabel: {
        [key: string]: number;
    };
    labelColors: {
        [key: string]: string;
    };
}

Dexie.debug = true;  


const entetyKeyString = "id, name, label";
const relationshipsKeyString = "id, label, from, type, to";
const conditionalFormattingKeyString = "id, name, label";
const diagramOptionsKeyString = "++id, diagramType";

type AppDatabase = Dexie & {
  enteties: EntityTable<
      Entity, 'id'>;
  relationships: EntityTable<RelationShip, 'id'>;
  conditionalFormatting: EntityTable<
      ConditionalFormatting, 'id'>;
  diagramOptions: EntityTable<DiagramOptions>;
}

export type DataBaseOptions = {
  selectedDb: string;
  dbVersion: number;
}

let dbOptions = localStore<DataBaseOptions>('database-options', {
  selectedDb: defaultDbName,
  dbVersion: dbVersion
});

let _db: AppDatabase = new Dexie(dbOptions.value.selectedDb) as AppDatabase;

export const db = _db;


_db.version(dbVersion).stores({
  enteties: entetyKeyString,
  relationships: relationshipsKeyString,
  conditionalFormatting: conditionalFormattingKeyString,
  diagramOptions: diagramOptionsKeyString
});



export async function openStore(name: string) {
  const availableStores = await Dexie.getDatabaseNames();
  if (!availableStores.includes(name)) {
    console.error(`Database ${name} does not exist`);
    return null;
  }

  console.log(`Opening database ${name}`);

  dbOptions.value.selectedDb = name;

  console.log(`Database options updated to`, dbOptions.value);

  _db = new Dexie(name) as Dexie & {
    enteties: EntityTable<
        Entity, 'id'>;
    relationships: EntityTable<RelationShip, 'id'>;
    conditionalFormatting: EntityTable<
        ConditionalFormatting, 'id'>;
    diagramOptions: EntityTable<DiagramOptions>;
  }

  _db.version(dbOptions.value.dbVersion).stores({
    enteties: entetyKeyString,
    relationships: relationshipsKeyString,
    conditionalFormatting: conditionalFormattingKeyString,
    diagramOptions: diagramOptionsKeyString
  });

  return await _db.open();
}

export async function createStore(name: string) {
  _db = new Dexie(name) as Dexie & {
    enteties: EntityTable<
        Entity, 'id'>;
    relationships: EntityTable<RelationShip, 'id'>;
    conditionalFormatting: EntityTable<
        ConditionalFormatting, 'id'>;
    diagramOptions: EntityTable<DiagramOptions>;
  }

  _db.version(dbVersion).stores({
    enteties: entetyKeyString,
    relationships: relationshipsKeyString,
    conditionalFormatting: conditionalFormattingKeyString,
    diagramOptions: diagramOptionsKeyString
  });

  return await _db.open();
}




export async function addOrUpdateDataStore(storeName: string, graphData: GraphData) {

  storeName = storeName.replace(/[^a-zA-Z0-9]/g, "_"); // Remove special characters from the store name
  const availableStores = await Dexie.getDatabaseNames();
  if (!availableStores.includes(storeName)) {
    await createStore(storeName);
  }

  if(!_db) {
    console.error("Database is not initialized. Please create or open a database first.");
    return;
  }

  if(_db.name !== storeName) {
    await openStore(storeName); // Open the new database connection
  }

    await _db.transaction('rw', _db.enteties, _db.relationships, async (tx) => {
      try {
        console.log("Adding data to the database...");
        const entityKeys = await tx.enteties.bulkPut(
          Dexie.deepClone(graphData.nodes),
          { allKeys: true }               // get an array of keys back
        );
  
        const relKeys = await tx.relationships.bulkPut(
          Dexie.deepClone(graphData.relationships),
          { allKeys: true }
        );
  
        console.log(
          `Committed ${entityKeys.length} entities and ${relKeys.length} relations`
        );
      } catch (e) {
        if (e instanceof Dexie.BulkError) {
          console.error(`${e.failures.length} rows failed`, e.failures);
          // re-throw so the whole transaction rolls back
          throw e;
        }
        throw e;
      }
    });
}

export type LabelRelationShips = {
    fromLabel: string;
    toLabel: string;
    relationshipType: "<->" | "->" | "<-";
    relationshipLabel: string;
}


export async function getLabelRelationships(label: string) {
  if (!_db) {
    console.error("Database is not initialized. Please create or open a database first.");
    return;
  }

    const relationships = await _db.relationships
        .where('from')
        .equals(label)
        .or('to')
        .equals(label)
        .toArray();
    return relationships;
}

export async function getAllLabels() {
    if (!_db) {
        console.error("Database is not initialized. Please create or open a database first.");
        return;
    }
    const labels = await _db.enteties
        .orderBy('label')
        .uniqueKeys();
    return labels;
}

export async function labelRelationShips(labels: string) {
    return await labelsRelationShips([labels]);
}


export async function labelsRelationShips(
    label: string[],
  ): Promise<LabelRelationShips[]> {

    if (!_db) {
      console.error("Database is not initialized. Please create or open a database first.");
      return [];
    }
  
    return _db.transaction('r', _db.enteties, _db.relationships, async () => {
  
      /* 1️⃣  Load the entities themselves */
      const entities = await _db!.enteties.where('label').anyOf(label).toArray();                  // Entity[]
  
      if (entities.length === 0) return [];
  
      /* 2️⃣  For each entity, kick off a query for *all* edges that
              touch its id, regardless of direction. */
      const edgePromises = entities.map(e =>
        _db!.relationships
          .where('from').equals(e.id)
          .or('to').equals(e.id)
          .toArray()                                                 // Promise<RelationShip[]>
      );
  
      /* 3️⃣  Wait for the edges, still in parallel */
      const edgeResults = await Promise.all(edgePromises);           // RelationShip[][]
  
      /* 4️⃣  From those edges, collect every neighbour id *once*.
              We do this per entity so we can bulk-get later. */
      const neighbourIdMatrix = edgeResults.map((edges, i) => {
        const set = new Set<string>();
        for (const edge of edges) {
          set.add(edge.from === entities[i].id ? edge.to : edge.from);
        }
        return [...set];                                             // string[]
      });
  
      /* 5️⃣  For each entity, kick off a bulkGet for its neighbours */
      const neighbourPromises = neighbourIdMatrix.map(ids =>
        _db!.enteties.bulkGet(ids)                                     // Promise<(Entity|undefined)[]>
      );
  
      const neighbourResults = await Promise.all(neighbourPromises); // (Entity|undefined)[][]
  
      /* 6️⃣  Stitch everything together into a richer object */
      return entities.map((entity, i): LabelRelationShips[] => {
        const edges = edgeResults[i];
        const neighbours = neighbourResults[i];
  
        const relations: LabelRelationShips[]  = edges.map(edge => {
          const otherId = edge.from === entity.id ? edge.to : edge.from;
          const idx      = neighbourIdMatrix[i].indexOf(otherId);
          const other    = neighbours[idx]; // non-null because id came from edges
          if (!other) {
            // console.warn(`Entity ${entity.name} has a relationship to ${otherId}, but that entity is missing`);
            return null;
          }
            
          return {
            fromLabel: entity.label,
            toLabel: other.label,
            relationshipType: edge.type,
            relationshipLabel: edge.label
          }
        }).filter((relation): relation is LabelRelationShips => relation !== null); // Filter out null values
        
  
        return relations;
      })
      // Only unique relationships are returned
      .flatMap(relations => relations)
      .filter((relation, index, self) => {
        return index === self.findIndex((r) => {
            return r.fromLabel === relation.fromLabel && r.toLabel === relation.toLabel && r.relationshipType === relation.relationshipType && r.relationshipLabel === relation.relationshipLabel;
            }
        );
      });  
    });
  }
  
