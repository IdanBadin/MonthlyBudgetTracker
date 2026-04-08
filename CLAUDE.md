# CLAUDE.md

## Session Start (MANDATORY — Do This Before Anything Else)

```bash
mkdir -p tasks
touch tasks/todo.md tasks/lessons.md
```

1. Read `tasks/todo.md`
2. Read `tasks/lessons.md`
3. If `tasks/session_context.md` exists — read it and **trust it as the source of truth**

**IMPORTANT: Do NOT re-read project source files to verify session context. Only read files when actively working on them. `session_context.md` is your memory — trust it.**

Then provide a **Session Briefing** in this exact format:

```
✅ Session initialized.

📍 Last stopping point: [from session_context.md]

📋 What was done so far:
- [completed item 1]
- [completed item 2]

🔄 Open tasks:
- [ ] [next task 1]
- [ ] [next task 2]

💡 Key context: [any critical decisions or warnings from last session]
```

**Do not respond to any user request until this briefing is complete.**

---

## Save Protocol (Manual Triggers Only)

Saving happens **only** when the user explicitly triggers it using one of these words:

**Hebrew:** `סיים`, `סגור`, `שמור`, `תשמור`, `סוף`, `יאללה ביי`, `תסגור`
**English:** `done`, `save`, `save session`, `bye`, `end`, `wrap up`, `that's it`, `finish`

### When triggered, OVERWRITE `tasks/session_context.md` with:

```markdown
# Session Context — [date]

## Project State
[What the project is and current status — 1-2 sentences]

## Completed Work
- [everything done, across all sessions]

## Last Stopping Point
[Exact description: file, function, line, what was being worked on]

## Next Steps (ordered)
1. [first action]
2. [second action]

## Active Files
[files modified or currently relevant]

## Environment
[servers, ports, env vars, running processes]

## Warnings
[anything that could trip up next session]
```

Also update `tasks/todo.md` — mark completed items ✅, add new items.

After saving, confirm:
```
✅ Session saved.
📍 Stopped at: [exact stopping point]
📋 Next session starts with: [first next step]
```

---

## Task Management

Non-trivial tasks (3+ steps):

1. **Plan** → Write to `tasks/todo.md`: Goal, Steps (checkboxes), Notes
2. **Confirm** → "Here's my plan. Should I proceed?" — wait for approval
3. **Track** → Check off items as completed
4. **Verify** → NEVER mark done without proving it works. Show actual output
5. **Lessons** → After any user correction, update `tasks/lessons.md`:
   ```
   ## Lesson — [date]
   Mistake: [what went wrong]
   Fix: [correct approach]
   Rule: [one-line prevention rule]
   ```

---

## Ruflo Swarm

Before starting a multi-faceted task, evaluate if Ruflo Swarm would help:
- Multi-file changes across 3+ files simultaneously
- Parallel work (frontend + backend + tests)
- Large refactors spanning multiple modules

If applicable, say: "💡 This task could benefit from Ruflo Swarm — [reason]. Want me to use it?"
Wait for confirmation.

---

## Workflow & Coding Principles

- **Plan first** — Any task with 3+ steps or architectural decisions. If stuck: STOP, re-plan
- **Subagents** — Use for research, exploration, parallel analysis. Keeps main context clean
- **Simplicity first** — minimal footprint, root causes not patches
- **Minimal impact** — only touch what's necessary
- **No guessing** — ask if unclear
- **Prove it works** — show, don't tell

---

## Token Efficiency

- **Concise responses** — skip preamble and filler
- **`/compact` at ~50% context** — preserve: modified files, task state, key decisions, test status
- **`/clear` between unrelated tasks**
- **Subagents for verbose operations** — test runs, log analysis, large file reads
- **Don't re-read files** already in context
- **Batch file edits** — combine related changes into single operations
- **Don't repeat yourself** — reference, don't restate

---

# PROJECT-SPECIFIC CONTEXT
<!-- /init will populate: project overview, folder structure, build/test/lint commands, architecture, dependencies -->
<!-- IMPORTANT: Keep this section under 100 lines. For details, link to docs/ -->
