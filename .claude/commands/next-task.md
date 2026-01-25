# Next Task

Pick the next task from the backlog and start working on it.

## Steps
1. Check WIP limits: `cwa task wip`
2. If in_progress is at limit, finish current task first
3. Pick highest priority task from `todo` column
4. Move it to `in_progress`: `cwa task move <id> in_progress`
5. Load the associated spec: `cwa spec status <spec>`
6. Begin implementation following the spec

## Pre-conditions
- No task currently in_progress (WIP limit: 1)
- Task must be in `todo` column
- Associated spec must have acceptance criteria
