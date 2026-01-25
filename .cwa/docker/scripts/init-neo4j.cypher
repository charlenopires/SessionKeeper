// CWA Knowledge Graph Schema
// Run with: cat init-neo4j.cypher | cypher-shell -u neo4j -p <password>

// Uniqueness constraints
CREATE CONSTRAINT spec_id IF NOT EXISTS FOR (s:Spec) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT task_id IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT context_id IF NOT EXISTS FOR (c:BoundedContext) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:DomainEntity) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT memory_id IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT term_id IF NOT EXISTS FOR (t:GlossaryTerm) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT observation_id IF NOT EXISTS FOR (o:Observation) REQUIRE o.id IS UNIQUE;

// Full-text search indexes
CREATE FULLTEXT INDEX spec_search IF NOT EXISTS FOR (s:Spec) ON EACH [s.title, s.description];
CREATE FULLTEXT INDEX task_search IF NOT EXISTS FOR (t:Task) ON EACH [t.title, t.description];
CREATE FULLTEXT INDEX memory_search IF NOT EXISTS FOR (m:Memory) ON EACH [m.content];
