# Workflow Kickoff

Start a new feature workflow from a high-level description.

## What This Skill Does

Takes a feature idea and drives it through the full CWA workflow:
1. Creates a specification with acceptance criteria
2. Breaks the spec into atomic tasks
3. Sets up the Kanban board
4. Generates Claude Code artifacts

## Usage

Provide a feature description and this skill will:

### Step 1: Specification
- Create spec: `cwa spec new "<title>" --description "<desc>" --priority <p>`
- Define acceptance criteria (Given/When/Then format)

### Step 2: Task Breakdown
- Create tasks from the spec's acceptance criteria
- Each task should be completable in under 2 hours
- Link tasks to the spec

### Step 3: Board Setup
- Move tasks to `todo` column
- Respect WIP limits

### Step 4: Artifact Generation
- Generate agent if new bounded context: `cwa codegen agent`
- Generate skill from spec: `cwa codegen skill <spec-id>`
- Update CLAUDE.md: `cwa codegen claude-md`

## Input
A natural language description of the feature to implement.

## Output
- Spec created with acceptance criteria
- Tasks on the Kanban board
- Claude Code artifacts generated
- Ready to start implementation
