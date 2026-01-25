# Domain Discovery

Interactive workflow for discovering domain concepts in your project.

## Steps
1. Ask about the core business problem
2. Identify key actors and roles
3. Map out main business processes
4. Extract nouns → potential entities/value objects
5. Extract verbs → potential commands/events
6. Group related concepts → bounded contexts
7. Define relationships between contexts

## Output
- Create bounded contexts: `cwa domain context new <name>`
- Add to glossary
- Record in knowledge graph: `cwa graph sync`
- Add key insights to memory: `cwa memory add`

## Questions to Ask
- What is the core business value?
- Who are the main actors?
- What are the key business processes?
- Where do different teams/concerns diverge? (context boundaries)
- What terms mean different things in different contexts?
