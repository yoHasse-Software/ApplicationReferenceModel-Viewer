import Dexie, { type EntityTable, type BulkError } from "dexie";
import type { BoxModel, DiagramTypes, GraphData, RuleOperator, TitleModel } from "$lib/types";

const databaseName = 'yh-graph-db';
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


export const db = new Dexie(databaseName) as Dexie & {
    enteties: EntityTable<
        Entity, 'id'>;
    relationships: EntityTable<RelationShip, 'id'>;
    conditionalFormatting: EntityTable<
        ConditionalFormatting, 'id'>;
    diagramOptions: EntityTable<DiagramOptions>;

}


const entetyKeyString = "id, name, label";
const relationshipsKeyString = "id, label, from, type, to";
const conditionalFormattingKeyString = "id, name, label";
const diagramOptionsKeyString = "++id, diagramType";

db.version(dbVersion).stores({
    enteties: entetyKeyString,
    relationships: relationshipsKeyString,
    conditionalFormatting: conditionalFormattingKeyString,
    diagramOptions: diagramOptionsKeyString
});



export async function addOrUpdateDataStore(graphData: GraphData) {
    await db.transaction('rw', db.enteties, db.relationships, async (tx) => {
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
