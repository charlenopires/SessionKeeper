# Project Status

Display a comprehensive overview of the current project state.

## Information to Gather
1. `cwa context status` — Active spec, current task, session info
2. `cwa task board` — Kanban board state
3. `cwa task wip` — WIP limit status
4. `cwa spec list` — All specifications and their states
5. `cwa graph status` — Knowledge graph statistics
6. `cwa tokens analyze --all` — Token budget usage

## Output Format
Present a concise summary:
- Current focus (active spec + in_progress task)
- Blockers or issues
- Progress metrics (done/total tasks)
- Suggested next action
