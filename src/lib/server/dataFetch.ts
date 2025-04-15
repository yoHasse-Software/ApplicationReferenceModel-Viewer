import type { RelationShip, LevelNode, GraphData, Entity, NodeRelation } from "$lib/types";
import { driver } from '$lib/server/neo4j';
import { NEO4J_DB_NAME } from "$env/static/private";


export async function fetchGraphByLabelsAsync(labels: string[]): Promise<GraphData> {
    const session = driver.session({
        database: NEO4J_DB_NAME // Or your custom database name
    });

    const labelString = labels.map(label => `"${label}"`).join(', ');

    const query = `
WITH [${labelString}] AS inputLabels
MATCH (n:$any(inputLabels))
WITH 
    n, 
    [(n)-[r]->(m) | r] AS rels
WITH 
    n{
        node: {
            id: n.id,
            name: n.name,
            label: head(labels(n)),
            metadata: properties(n)
        },
        relationships: [r IN rels | {
            type: type(r),
            from: startNode(r).id,
            to: endNode(r).id,
            metadata: properties(r)
        }]
    }
RETURN 
    n AS entity
`;

    try {
        const result = await session.run(query);

        // console.log('Result:', result.records);

        const graphData = {
            nodes: [] as Entity[],
            relationships: [] as RelationShip[]
        };

        result.records.forEach(record => {
            const resultEntity = record.get('entity');
            const node = resultEntity.node;
            const entity: Entity = {
                id: node.id,
                name: node.name,
                label: node.label,
                metadata: node.metadata
            };
            graphData.nodes.push(entity);

            const relationships = resultEntity.relationships.map((rel: any) => {
                const relationship: RelationShip = {
                    from: node.id,
                    type: rel.type,
                    to: rel.to,
                    metadata: rel.metadata
                };
                return relationship;
            });
            graphData.relationships.push(...relationships);
        });

        return graphData; // Relationships can be fetched separately if needed
    } catch (error) {
        console.error('Error fetching data from Neo4j:', error);
        return { nodes: [], relationships: [] };
    } finally {
        await session.close();
    }

}

export async function fetchGraphRelationshipsAsync() : Promise<NodeRelation[]> {
    
        const session = driver.session({
            database: NEO4J_DB_NAME // Or your custom database name
        });

        const query = `
MATCH (a)-[r]->(b)
WITH 
    head(labels(a)) AS from_label, 
    type(r) AS rel_type, 
    head(labels(b)) AS to_label
RETURN DISTINCT from_label, rel_type, to_label
ORDER BY from_label, rel_type, to_label;
`;

        try {
            const result = await session.run(query);
            const records: NodeRelation[] = result.records.map(record => ({
                fromLabel: record.get('from_label'),
                relationType: record.get('rel_type'),
                toLabel: record.get('to_label')
            }));
            return records;
        } catch (error) {
            console.error('Error fetching metadata from Neo4j:', error);
            return [];
        } finally {
            await session.close();
        }



}


