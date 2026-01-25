# Sync Context

Regenerate all Claude Code artifacts and synchronize the knowledge graph.

## Steps
1. Regenerate CLAUDE.md: `cwa codegen claude-md`
2. Regenerate agents: `cwa codegen agent --all`
3. Regenerate hooks: `cwa codegen hooks`
4. Sync knowledge graph: `cwa graph sync`
5. Sync memory: `cwa memory sync`
6. Report token usage: `cwa tokens report`

## When to Run
- After creating new bounded contexts
- After defining new specs
- After recording important decisions
- At the start of each development session
- After completing a major feature
