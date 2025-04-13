


```

// Application reference model and implementation
(:ApplicationArea) 
  -[:CONTAINS]-> (:ApplicationGroup)

(:ApplicationGroup) 
  -[:CONTAINS]-> (:Application)

(:System) 
  -[:SUPPORTS]-> (:Application)

(:Application) 
  -[:DEPLOYED_ON]-> (:System)

(:Person) 
  -[:MAINTAINS]-> (:Application)

(:Application) 
  -[:SUPPORTS]-> (:Process)

(:Application) 
  -[:USES]-> (:InformationSet)

(:Application) 
  -[:CONTAINS]-> (:ClassificationObject)

(:ClassificationObject) 
  -[:HAS]-> (:InformationSet)

(:InformationSet) 
  -[:CLASSIFIED_AS]-> (:CIAClassification) 

(:Application) 
  -[:PART_OF_LAYER]-> (:AppLayer)  

(:Application) 
  -[:CATEGORIZED_AS]-> (:AppCategory) 

// Business process and capability structure
(:Process) 
  -[:REALIZES]-> (:Capability)

(:Capability) 
  -[:BELONGS_TO]-> (:CapabilityArchitecture)

(:Process) 
  -[:PART_OF]-> (:ProcessArchitecture) 

// BMC and strategy
(:BusinessModelCanvas) 
  -[:REQUIRES]-> (:Capability)

(:BusinessGoal) 
  -[:UTFORMAR]-> (:TargetArchitecture)

(:BusinessGoal) 
  -[:INFLUENCES]-> (:BusinessModelCanvas)

(:BusinessGoal) 
  -[:STYRS_AV]-> (:ArchitecturePrinciple)

(:ArchitecturePrinciple) 
  -[:GUIDES]-> (:ReferenceArchitecture)

(:ReferenceArchitecture) 
  -[:GUIDES]-> (:TargetArchitecture)

(:TargetArchitecture) 
  -[:REALIZES]-> (:CapabilityArchitecture)

(:TargetArchitecture) 
  -[:STRUCTURES]-> (:ApplicationArchitecture) 

(:Application) 
  -[:PART_OF]-> (:ApplicationArchitecture) 


```



```

# run commands
docker run --name neo4j `
  -p7474:7474 -p7687:7687 `
  -e NEO4J_AUTH=neo4j/whassupmyhomie `
  -e NEO4J_PLUGINS='["apoc"]' `
  -e NEO4J_apoc_import_file_enabled=true `
  -e NEO4J_apoc_export_file_enabled=true `
  -e NEO4J_dbms_security_procedures_unrestricted=apoc.* `
  -e NEO4J_dbms_security_procedures_allowlist=apoc.* `
  -v "C:\Users\marnat\git\Arkitektur\ApplicationReferenceModel-Viewer\db\imports:/var/lib/neo4j/import" `
  -d neo4j:2025.03




Get-Content .\script.cypher | docker exec -i neo4j cypher-shell -u neo4j -p whassupmyhomie

docker cp N3.csv neo4j:/var/lib/neo4j/import/


```


Get-Content .\db\jsonImport.cypher | docker exec -i neo4j cypher-shell -u neo4j -p whassupmyhomie


db\content\architecture.json



// TODO: PostgreSQL

https://age.apache.org/getstarted/quickstart/