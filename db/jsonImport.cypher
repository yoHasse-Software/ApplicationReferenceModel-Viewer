// Load and create nodes with metadata
CALL apoc.load.json("file:///architecture.json") YIELD value
UNWIND value.nodes AS node
MERGE (n {id: node.id})
SET n.name = node.name
SET n += node.metadata
WITH n, node
CALL apoc.create.addLabels(n, [node.label]) YIELD node AS _
RETURN count(n) AS nodes_imported;

// Load and create relationships with metadata
CALL apoc.load.json("file:///architecture.json") YIELD value
UNWIND value.relationships AS rel
MATCH (from {id: rel.from})
MATCH (to {id: rel.to})
MERGE (from)-[r:REL {id: rel.id}]->(to)
SET r += rel.metadata
WITH r, rel
CALL apoc.refactor.setType(r, rel.type) YIELD input, output
RETURN count(output) AS relationships_imported;



