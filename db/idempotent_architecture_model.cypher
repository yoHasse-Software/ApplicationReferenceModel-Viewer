
// === Business Strategy and Governance ===
MERGE (:BusinessGoal {name: "Improve Student Experience"});
MERGE (:ArchitecturePrinciple {name: "Cloud First"});
MERGE (:BusinessModelCanvas {name: "Student Services BMC"});

// === Architecture Layers ===
MERGE (:ReferenceArchitecture {name: "Higher Ed App Ref Model"});
MERGE (:TargetArchitecture {name: "Target 2026"});
MERGE (:ApplicationArchitecture {name: "Student Applications"});
MERGE (:CapabilityArchitecture {name: "Student Capability Map"});
MERGE (:ProcessArchitecture {name: "Core Student Processes"});

// === Capabilities and Processes ===
MERGE (:Capability {name: "Student Administration"});
MERGE (:Process {name: "Course Registration"});

// === Applications and Related Structures ===
MERGE (:ApplicationArea {name: "Education"});
MERGE (:ApplicationGroup {name: "Student Services"});
MERGE (:Application {name: "Student Portal"});
MERGE (:Application {name: "Course Planner"});
MERGE (:System {name: "Frontend Server"});
MERGE (:System {name: "Backend API"});
MERGE (:AppLayer {name: "Presentation"});
MERGE (:AppCategory {name: "Self-Service"});
MERGE (:Person {name: "Anna"});
MERGE (:ClassificationObject {name: "Course Data"});
MERGE (:InformationSet {name: "Registered Students"});
MERGE (:CIAClassification {level: "High"});

// === Relationships === examples
// MATCH (g:BusinessGoal {name: "Improve Student Experience"})-[:FORMS]->(ta:TargetArchitecture {name: "Target 2026"})
// MERGE (g)-[:FORMS]->(ta);

// MATCH (g:BusinessGoal {name: "Improve Student Experience"})-[:INFLUENCES]->(bmc:BusinessModelCanvas {name: "Student Services BMC"})
// MERGE (g)-[:INFLUENCES]->(bmc);

// MATCH (g:BusinessGoal {name: "Improve Student Experience"}), (p:ArchitecturePrinciple {name: "Cloud First"}) 
// MERGE (g)-[:GOVERNED_BY]->(p);

// MATCH (p:ArchitecturePrinciple {name: "Cloud First"}), (ra:ReferenceArchitecture {name: "Higher Ed App Ref Model"}) 
// MERGE (p)-[:GUIDES]->(ra);

// MATCH (ra:ReferenceArchitecture {name: "Higher Ed App Ref Model"}), (ta:TargetArchitecture {name: "Target 2026"}) 
// MERGE (ra)-[:GUIDES]->(ta);

// MATCH (ta:TargetArchitecture {name: "Target 2026"}), (ca:CapabilityArchitecture {name: "Student Capability Map"}) 
// MERGE (ta)-[:REALIZES]->(ca);

// MATCH (ta:TargetArchitecture {name: "Target 2026"}), (aa:ApplicationArchitecture {name: "Student Applications"}) 
// MERGE (ta)-[:STRUCTURES]->(aa);

// MATCH (bmc:BusinessModelCanvas {name: "Student Services BMC"}), (cap:Capability {name: "Student Administration"}) 
// MERGE (bmc)-[:REQUIRES]->(cap);

// MATCH (cap:Capability {name: "Student Administration"}), (ca:CapabilityArchitecture {name: "Student Capability Map"}) 
// MERGE (cap)-[:BELONGS_TO]->(ca);

// MATCH (proc:Process {name: "Course Registration"}), (cap:Capability {name: "Student Administration"}) 
// MERGE (proc)-[:REALIZES]->(cap);

// MATCH (proc:Process {name: "Course Registration"}), (pa:ProcessArchitecture {name: "Core Student Processes"}) 
// MERGE (proc)-[:PART_OF]->(pa);

// MATCH (area:ApplicationArea {name: "Education"}), (group:ApplicationGroup {name: "Student Services"}) 
// MERGE (area)-[:CONTAINS]->(group);

// MATCH (group:ApplicationGroup {name: "Student Services"}), (app:Application {name: "Student Portal"}) 
// MERGE (group)-[:CONTAINS]->(app);

// MATCH (group:ApplicationGroup {name: "Student Services"}), (app:Application {name: "Course Planner"}) 
// MERGE (group)-[:CONTAINS]->(app);

// MATCH (app:Application {name: "Student Portal"}), (sys:System {name: "Frontend Server"}) 
// MERGE (sys)-[:SUPPORTS]->(app);

// MATCH (app:Application {name: "Course Planner"}), (sys:System {name: "Backend API"}) 
// MERGE (sys)-[:SUPPORTS]->(app);

// MATCH (app:Application {name: "Student Portal"}), (sys:System {name: "Frontend Server"}) 
// MERGE (app)-[:DEPLOYED_ON]->(sys);

// MATCH (app:Application {name: "Student Portal"}), (layer:AppLayer {name: "Presentation"}) 
// MERGE (app)-[:PART_OF_LAYER]->(layer);

// MATCH (app:Application {name: "Student Portal"}), (cat:AppCategory {name: "Self-Service"}) 
// MERGE (app)-[:CATEGORIZED_AS]->(cat);

// MATCH (person:Person {name: "Anna"}), (app:Application {name: "Student Portal"}) 
// MERGE (person)-[:MAINTAINS]->(app);

// MATCH (app:Application {name: "Student Portal"}), (proc:Process {name: "Course Registration"}) 
// MERGE (app)-[:SUPPORTS]->(proc);

// MATCH (app:Application {name: "Student Portal"}), (co:ClassificationObject {name: "Course Data"}) 
// MERGE (app)-[:CONTAINS]->(co);

// MATCH (co:ClassificationObject {name: "Course Data"}), (info:InformationSet {name: "Registered Students"}) 
// MERGE (co)-[:HAS]->(info);

// MATCH (app:Application {name: "Student Portal"}), (info:InformationSet {name: "Registered Students"}) 
// MERGE (app)-[:USES]->(info);

// MATCH (info:InformationSet {name: "Registered Students"}), (cia:CIAClassification {level: "High"}) 
// MERGE (info)-[:CLASSIFIED_AS]->(cia);

// MATCH (app:Application {name: "Student Portal"}), (aa:ApplicationArchitecture {name: "Student Applications"}) 
// MERGE (app)-[:PART_OF]->(aa);