# Memory Rules

When and how to record project memory.

## What to Record

### Decisions (--type decision)
- Technology choices and trade-offs
- Architecture patterns adopted
- Libraries chosen (and alternatives rejected)
- API design decisions

### Facts (--type fact)
- External API behaviors discovered
- Performance characteristics measured
- Environment-specific behaviors
- Integration quirks

### Preferences (--type preference)
- Code style preferences
- Naming conventions agreed upon
- Team workflow preferences
- Tool configuration choices

### Patterns (--type pattern)
- Recurring code patterns in the project
- Error handling approaches
- Testing strategies that work well
- Deployment procedures

## When to Record
- After making a non-obvious technical choice
- When discovering unexpected behavior
- When a team member states a preference
- After resolving a difficult bug (root cause)
- When establishing a new pattern

## Rules
- Keep entries concise (1-2 sentences)
- Include context ("for X, we do Y because Z")
- Use `cwa memory search` before adding duplicates
- Periodically compact: `cwa memory compact`
