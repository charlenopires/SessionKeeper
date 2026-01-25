# Workflow Rules

These rules enforce the CWA development workflow.

## Spec Before Code
- Every non-trivial feature requires a specification
- Specs must have acceptance criteria before implementation begins
- Use `cwa spec validate` to check completeness

## Kanban Discipline
- Only 1 task in_progress at a time (WIP limit enforced)
- Tasks flow: backlog → todo → in_progress → review → done
- Never skip the review step
- Check WIP with `cwa task wip` before moving tasks

## Decision Tracking
- Record architectural decisions as they are made
- Use `cwa memory add "<decision>" --type decision`
- Decisions should include rationale (the "why")
- Review past decisions before making conflicting ones

## Context Sync
- Run `cwa codegen claude-md` after significant changes
- Keep token budget below limits (`cwa tokens optimize`)
- Sync graph after new entities: `cwa graph sync`
