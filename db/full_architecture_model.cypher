
// === Business Strategy and Governance ===
CREATE (:BusinessGoal {name: "Improve Student Experience"});
CREATE (:ArchitecturePrinciple {name: "Cloud First"});
CREATE (:BusinessModelCanvas {name: "Student Services BMC"});

// === Architecture Layers ===
CREATE (:ReferenceArchitecture {name: "Higher Ed App Ref Model"});
CREATE (:TargetArchitecture {name: "Target 2026"});
CREATE (:ApplicationArchitecture {name: "Student Applications"});
CREATE (:CapabilityArchitecture {name: "Student Capability Map"});
CREATE (:ProcessArchitecture {name: "Core Student Processes"});

// === Capabilities and Processes ===
CREATE (:Capability {name: "Student Administration"});
CREATE (:Process {name: "Course Registration"});

// === Applications and Related Structures ===
CREATE (:ApplicationArea {name: "Education"});
CREATE (:ApplicationGroup {name: "Student Services"});
CREATE (:Application {name: "Student Portal"});
CREATE (:Application {name: "Course Planner"});
CREATE (:System {name: "Frontend Server"});
CREATE (:System {name: "Backend API"});
CREATE (:AppLayer {name: "Presentation"});
CREATE (:AppCategory {name: "Self-Service"});
CREATE (:Person {name: "Anna"});
CREATE (:ClassificationObject {name: "Course Data"});
CREATE (:InformationSet {name: "Registered Students"});
CREATE (:CIAClassification {level: "High"});

// === Relationships ===
// Strategy & Governance
MATCH (g:BusinessGoal), (ta:TargetArchitecture) CREATE (g)-[:UTFORMAR]->(ta);
MATCH (g:BusinessGoal), (bmc:BusinessModelCanvas) CREATE (g)-[:INFLUENCES]->(bmc);
MATCH (g:BusinessGoal), (p:ArchitecturePrinciple) CREATE (g)-[:STYRS_AV]->(p);
MATCH (p:ArchitecturePrinciple), (ra:ReferenceArchitecture) CREATE (p)-[:GUIDES]->(ra);
MATCH (ra:ReferenceArchitecture), (ta:TargetArchitecture) CREATE (ra)-[:GUIDES]->(ta);
MATCH (ta:TargetArchitecture), (ca:CapabilityArchitecture) CREATE (ta)-[:REALIZES]->(ca);
MATCH (ta:TargetArchitecture), (aa:ApplicationArchitecture) CREATE (ta)-[:STRUCTURES]->(aa);

// BMC and Capabilities
MATCH (bmc:BusinessModelCanvas), (cap:Capability) CREATE (bmc)-[:REQUIRES]->(cap);

// Capabilities and Processes
MATCH (cap:Capability), (ca:CapabilityArchitecture) CREATE (cap)-[:BELONGS_TO]->(ca);
MATCH (proc:Process), (cap:Capability) CREATE (proc)-[:REALIZES]->(cap);
MATCH (proc:Process), (pa:ProcessArchitecture) CREATE (proc)-[:PART_OF]->(pa);

// Application Ref Model
MATCH (area:ApplicationArea), (group:ApplicationGroup) CREATE (area)-[:CONTAINS]->(group);
MATCH (group:ApplicationGroup), (app:Application {name: "Student Portal"}) CREATE (group)-[:CONTAINS]->(app);
MATCH (group:ApplicationGroup), (app:Application {name: "Course Planner"}) CREATE (group)-[:CONTAINS]->(app);

// Applications and Systems
MATCH (app:Application {name: "Student Portal"}), (sys:System {name: "Frontend Server"}) CREATE (sys)-[:SUPPORTS]->(app);
MATCH (app:Application {name: "Course Planner"}), (sys:System {name: "Backend API"}) CREATE (sys)-[:SUPPORTS]->(app);
MATCH (app:Application), (sys:System) WHERE app.name = "Student Portal" AND sys.name = "Frontend Server" CREATE (app)-[:DEPLOYED_ON]->(sys);
MATCH (app:Application), (layer:AppLayer) CREATE (app)-[:PART_OF_LAYER]->(layer);
MATCH (app:Application), (cat:AppCategory) CREATE (app)-[:CATEGORIZED_AS]->(cat);

// People and Maintenance
MATCH (person:Person), (app:Application {name: "Student Portal"}) CREATE (person)-[:MAINTAINS]->(app);

// App ↔ Process ↔ Info
MATCH (app:Application {name: "Student Portal"}), (proc:Process) CREATE (app)-[:SUPPORTS]->(proc);
MATCH (app:Application), (co:ClassificationObject) CREATE (app)-[:CONTAINS]->(co);
MATCH (co:ClassificationObject), (info:InformationSet) CREATE (co)-[:HAS]->(info);
MATCH (app:Application), (info:InformationSet) CREATE (app)-[:USES]->(info);
MATCH (info:InformationSet), (cia:CIAClassification) CREATE (info)-[:CLASSIFIED_AS]->(cia);

// Applications in App Architecture
MATCH (app:Application), (aa:ApplicationArchitecture) CREATE (app)-[:PART_OF]->(aa);
