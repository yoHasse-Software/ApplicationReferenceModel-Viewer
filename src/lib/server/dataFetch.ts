import type { LevelNode } from "$lib/types";
import { driver } from '$lib/server/neo4j';



function mapToLevelNode(data: any, parentId?: string): LevelNode {

    const id = crypto.randomUUID(); // Generate a unique ID for the node

    const node: LevelNode = {
        id,
        name: data.name,
        parent: parentId,
        value: 1,
        isGroup: data.isGroup ?? true,
        ...(data.metadata ? { metadata: data.metadata } : {})
    };


    if (data.children?.length) {
        node.children = data.children.filter((child: any) => child.name).map((child: any) => mapToLevelNode(child, id));
    }

    return node;
}


export async function getAsTreeAsync() {

    const session = driver.session({
        database: 'neo4j' // Or your custom database name
    });

    try {
        const result = await session.run(`
MATCH (area:ApplicationArea)
OPTIONAL MATCH (area)-[:CONTAINS]->(group:ApplicationGroup)
OPTIONAL MATCH (group)-[:CONTAINS]->(app:Application)
OPTIONAL MATCH (sw:Software)-[:SUPPORTS]->(app)

WITH area, group, app, COLLECT(DISTINCT {
  name: sw.name,
  id: sw.id,
  isGroup: false,
  metadata: sw { .beskrivning, .livscykelstatus_verksamhet, .livscykelstatus_teknik, .livscykelstatus_kompetens, .leverantör, .drift_start }
}) AS softwares

WITH area, group, COLLECT(DISTINCT {
  name: app.name,
  id: app.id,
  isGroup: true,
  children: softwares,
  metadata: app { .* }
}) AS apps

WITH area, COLLECT(DISTINCT {
  name: group.name,
  id: group.id,
  isGroup: true,
  children: apps,
  metadata: group { .* }
}) AS groups

RETURN {
  name: area.name,
  id: area.id,
  isGroup: true,
  children: groups,
  metadata: area { .* }
} AS tree
`);

        const rawTrees = result.records.map(record => record.get('tree'));
        return rawTrees.map(root => mapToLevelNode(root));
    } catch (error) {
        console.error('Error fetching data from Neo4j:', error);
        return [];
    } finally {
        await session.close();
    }
}