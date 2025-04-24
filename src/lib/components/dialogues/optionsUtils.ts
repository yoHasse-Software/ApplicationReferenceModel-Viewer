import type { Entity, GraphData, RelationShipsOption } from "$lib/types";


export function buildRelationShipMap(data: GraphData): Map<string, RelationShipsOption[]> {
    const relationShipOptions: Map<string, RelationShipsOption[]> = new Map<string, RelationShipsOption[]>();

    const entityMap: Map<string, Entity> = data.nodes
        .reduce((map, node) => {
            map.set(node.id, node);
            return map;
        }, new Map<string, Entity>());

    const duplicates = new Set<string>();

    data.relationships
        .filter((rel) => entityMap.has(rel.from) || entityMap.has(rel.to))
        .map((rel) => {
            return {
                fromLabel: entityMap.get(rel.from)?.label || "",
                toLabel: entityMap.get(rel.to)?.label || "",
                direction: "to",
                relationType: rel.type,
            } as RelationShipsOption;
        }).reduce((map, rel) => {
            
            
            if (rel.fromLabel && !map.has(rel.fromLabel)) {
                map.set(rel.fromLabel, []);
            }
            if (rel.toLabel && !map.has(rel.toLabel)) {
                map.set(rel.toLabel, []);
            }

            const relKey = `${rel.fromLabel}-${rel.relationType}:to`;
            if (!rel.fromLabel || !rel.toLabel ||  duplicates.has(relKey)) {
                return map;
            }

            duplicates.add(relKey);

            const existingFromRel = map.get(rel.fromLabel)!;
            existingFromRel.push(rel);

            const toLabelKey = `${rel.toLabel}-${rel.relationType}:from`;

            if (duplicates.has(toLabelKey)) {
                return map;
            }

            duplicates.add(toLabelKey);
            const existingToRel = map.get(rel.toLabel)!;
            existingToRel.push({
                ...rel,
                direction: "from",
            });

            return map;
        }, new Map<string, RelationShipsOption[]>())
        .forEach((rel, key) => {
            relationShipOptions.set(key, rel);
        });

    return relationShipOptions;
 }