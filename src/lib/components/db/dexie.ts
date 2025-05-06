import Dexie, { type EntityTable, type BulkError, type Collection } from "dexie";
import type { GraphData} from "$lib/types";
import type { ConditionalFormatting, DataRepository, DiagramOptions, Entity, LabelRelationShips, RelationShip } from "./dataRepository";



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

export class AppDexie implements DataRepository {
  private db: AppDatabase;
  private storeName: string;

  constructor(selectedDb: string, dbVersion: number = 1) {
    this.storeName = selectedDb.replace(/[^a-zA-Z0-9]/g, "_"); // Remove special characters from the store name
    this.db = new Dexie(selectedDb) as AppDatabase;
    this.db.version(dbVersion).stores({
      enteties: entetyKeyString,
      relationships: relationshipsKeyString,
      conditionalFormatting: conditionalFormattingKeyString,
      diagramOptions: diagramOptionsKeyString
    });
  }

  async initialize(){
    await this.db.open().catch((error) => {
      console.error("Failed to open database:", error);
    });
  }

  async initData(graphData: GraphData) {
    await this.db.transaction('rw', this.db.enteties, this.db.relationships, async (tx) => {
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

  async getAvailableStores(): Promise<string[]> {
    const availableStores = await Dexie.getDatabaseNames();
    return availableStores.filter(store => store !== this.storeName);
  }


  async getEnteties(): Promise<Entity[]> {
    return this.db.enteties.toArray();
  }
  async getAllLabels(): Promise<string[]> {
    return this.db.enteties.orderBy('label').uniqueKeys() as Promise<string[]>;
  }

  async getLabelRelationships(label: string): Promise<RelationShip[]> {
    return this.db.relationships
        .where('from')
        .equals(label)
        .or('to')
        .equals(label)
        .toArray();
  }

  async getLabelRelations(labels: string[]): Promise<LabelRelationShips[]> {
    if (!this.db) {
      console.error("Database is not initialized. Please create or open a database first.");
      return [];
    }
  
    return this.db.transaction('r', this.db.enteties, this.db.relationships, async () => {
  
      /* 1️⃣  Load the entities themselves */
      const entities = await this.db!.enteties.where('label').anyOf(labels).toArray();                  // Entity[]
  
      if (entities.length === 0) return [];
  
      /* 2️⃣  For each entity, kick off a query for *all* edges that
              touch its id, regardless of direction. */
      const edgePromises = entities.map(e =>
        this.db!.relationships
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
        this.db!.enteties.bulkGet(ids)                                     // Promise<(Entity|undefined)[]>
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

  async getRelationships(): Promise<RelationShip[]> {
    return this.db.relationships.toArray();
  }
  async getConditionalFormatting(): Promise<ConditionalFormatting[]> {
    return this.db.conditionalFormatting.toArray();
  }
  async getDiagramOptions(): Promise<DiagramOptions[]> {
    return this.db.diagramOptions.toArray();
  }

  async getEntitiesByLabel(label: string): Promise<Entity[]> {
    return this.db.enteties.where('label').equals(label).toArray();
  }

  async getConditionalFormattingByLabel(label: string): Promise<ConditionalFormatting[]> {
    return this.db.conditionalFormatting.where('label').equals(label).toArray();
  }

  async addConditionalFormatting(conditionalFormatting: ConditionalFormatting): Promise<void> {
    await this.db.conditionalFormatting.add(conditionalFormatting).catch((error) => {
      console.error("Failed to add conditional formatting:", error);
    });
  }

  async updateConditionalFormatting(conditionalFormatting: ConditionalFormatting): Promise<void> {
    const deepCloneConditionalFormatting = Dexie.deepClone(conditionalFormatting);
    await this.db.conditionalFormatting.update(deepCloneConditionalFormatting.id, deepCloneConditionalFormatting).catch((error) => {
      console.error("Failed to update conditional formatting:", error);
    });
  }

  async deleteConditionalFormatting(id: string): Promise<void> {
    await this.db.conditionalFormatting.delete(id).catch((error) => {
      console.error("Failed to delete conditional formatting:", error);
    });
  }

  async addDiagramOptions(diagramOptions: DiagramOptions): Promise<void> {
    const deepCloneDiagramOptions = Dexie.deepClone(diagramOptions);
    await this.db.diagramOptions.add(deepCloneDiagramOptions).catch((error) => {
      console.error("Failed to add diagram options:", error);
    });
  }

  async updateDiagramOptions(diagramOptions: DiagramOptions): Promise<void> {
    const deepCloneDiagramOptions = Dexie.deepClone(diagramOptions);
    await this.db.diagramOptions.put(deepCloneDiagramOptions).catch((error) => {
      console.error("Failed to update diagram options:", error);
    });
  }

}




