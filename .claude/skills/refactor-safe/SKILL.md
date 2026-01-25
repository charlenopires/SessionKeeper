# Safe Refactoring

Perform a refactoring with test safety net.

## What This Skill Does

Guides a safe refactoring process:
1. Ensures tests exist and pass before changes
2. Performs the refactoring in small, verified steps
3. Verifies tests still pass after each step

## Process

### Pre-Refactor
1. Identify the code to refactor
2. Run existing tests: verify they pass
3. If no tests exist: write characterization tests first
4. Record the refactoring decision: `cwa memory add "<what and why>" --type decision`

### During Refactor
1. Make one small change at a time
2. Run tests after each change
3. If tests fail: revert the last change
4. Commit after each successful step

### Post-Refactor
1. Run full test suite
2. Check for any new warnings
3. Update documentation if APIs changed
4. Move task to review: `cwa task move <id> review`

## Rules
- Never refactor and add features simultaneously
- Keep commits atomic (one logical change each)
- If tests don't exist, write them first (separate commit)
- Preserve all existing behavior unless explicitly changing it
