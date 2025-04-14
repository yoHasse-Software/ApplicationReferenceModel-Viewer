// Load and merge nodes with dynamic labels
CALL apoc.load.json("file:///architecture.json") YIELD value AS data
UNWIND data.nodes AS node
MERGE (n {id: node.id})
SET n:$(node.label)
SET n.name = node.name
SET n += node.metadata;

// Load and merge relationships with dynamic types
CALL apoc.load.json("file:///architecture.json") YIELD value AS data2
UNWIND data2.relationships AS rel
MATCH (from {id: rel.from})
MATCH (to {id: rel.to})
CALL {
  WITH from, to, rel
  CALL apoc.cypher.doIt(
    'MERGE (from)-[r:' + rel.type + ']->(to) SET r += $props',
    {from: from, to: to, props: rel.metadata}
  ) YIELD value AS inner
  RETURN inner
}
RETURN 'Relationships processed' AS status;

