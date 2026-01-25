# Review Code

Review the current changes against the specification's acceptance criteria.

## Steps
1. Get current task: `cwa_get_current_task()`
2. Load spec: `cwa_get_spec(task.spec_id)`
3. Read changed files (git diff)
4. For each acceptance criterion:
   - Verify implementation exists
   - Check test coverage
   - Mark as pass/fail
5. If all pass: `cwa task move <id> review`
6. If issues found: list them and keep in_progress

## Checklist
- [ ] All acceptance criteria met
- [ ] Tests pass
- [ ] No new warnings or lint issues
- [ ] No hardcoded values or secrets
- [ ] Error handling is appropriate
