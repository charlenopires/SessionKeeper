# Implement Task

Implement the current task following the specification.

## Pre-Implementation
1. `cwa_get_current_task()` - Load task details
2. `cwa_get_spec(task.spec_id)` - Load specification
3. Read relevant code files

## Implementation Rules
- Follow TDD: test first, then implement
- Keep changes focused on task scope
- Commit after each logical change

## Post-Implementation
1. Run all tests
2. `cwa_update_task_status(task_id, 'review')`
3. Record any decisions made
