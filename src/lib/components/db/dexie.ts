import Dexie, { type EntityTable, type BulkError, type Collection, liveQuery, type Observable } from "dexie";
import type { ConditionalFormatting, DiagramOptions, Entity, LabelRelationShips, RelationShip, Perspective } from "./dataRepository";

const idbName = 'data-viz';
const dbVersion = 1;

Dexie.debug = true;  


const entetyKeyString = "id, name, label";
const relationshipsKeyString = "id, label, from, type, to";
const conditionalFormattingKeyString = "++id, label, perspectiveId, *ignoredDiagrams";
const diagramOptionsKeyString = "++id, perspectiveId";
const perspectivesKeyString = "++id, name";

type AppDatabase = Dexie & {
  enteties: EntityTable<Entity, 'id'>;
  relationships: EntityTable<RelationShip, 'id'>;
  conditionalFormatting: EntityTable<ConditionalFormatting, 'id'>;
  diagramOptions: EntityTable<DiagramOptions, 'id'>;
  perspectives: EntityTable<Perspective, 'id'>;
}

export const idb = new Dexie(idbName) as AppDatabase;

idb.version(dbVersion).stores({
  enteties: entetyKeyString,
  relationships: relationshipsKeyString,
  conditionalFormatting: conditionalFormattingKeyString,
  diagramOptions: diagramOptionsKeyString,
  perspectives: perspectivesKeyString,
});


export async function getLabelRelations(labels: string[]): Promise<LabelRelationShips[]> {
  if (!idb) {
    console.error("Database is not initialized. Please create or open a database first.");
    return [];
  }
  return idb.transaction('r', idb.enteties, idb.relationships, async () => {

    /* 1️⃣  Load the entities themselves */
    const entities = await idb!.enteties.where('label').anyOf(labels).toArray();                  // Entity[]

    if (entities.length === 0) return [];

    /* 2️⃣  For each entity, kick off a query for *all* edges that
            touch its id, regardless of direction. */
    const edgePromises = entities.map(e =>
      idb!.relationships
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
      idb!.enteties.bulkGet(ids)                                     // Promise<(Entity|undefined)[]>
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