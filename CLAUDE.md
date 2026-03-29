# CLAUDE.md

## Session Start (MANDATORY — Do This Before Anything Else)

```bash
mkdir -p tasks
touch tasks/todo.md tasks/lessons.md
```

1. Read `tasks/todo.md`
2. Read `tasks/lessons.md`
3. If `tasks/session_context.md` exists — read it

Then provide a **Session Briefing** in this exact format:

```
✅ Session initialized.

📍 Last stopping point: [exact file/function/line where work stopped]

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

## Auto-Save (MANDATORY — Runs Automatically)

Auto-save OVERWRITES `tasks/session_context.md` each time (not append). 
Manual triggers do the same — no duplication.

IMPORTANT: At the **end of every conversation turn where meaningful work was completed**, silently update `tasks/session_context.md`. Do NOT wait for the user to ask. Do NOT skip this even if the user seems done.

This ensures that if the user closes the session without saying goodbye, **nothing is lost**.

### What to save in `tasks/session_context.md`:

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

Also update `tasks/todo.md` — mark completed items ✅, add new items that emerged.

---

## Manual Save Triggers

When the user says any of these, run the full save protocol AND confirm:

**Hebrew:** `סיים`, `סגור`, `שמור`, `תשמור`, `סוף`, `יאללה ביי`, `תסגור`
**English:** `done`, `save`, `save session`, `bye`, `end`, `wrap up`, `that's it`, `finish`

After saving, confirm:
```
✅ Session saved.
📍 Stopped at: [exact stopping point]
📋 Next session starts with: [first next step]
```

---

## Task Management

Non-trivial tasks (3+ steps) follow this sequence:

1. **Plan** → Write to `tasks/todo.md`: Goal (one sentence), Steps (checkboxes), Notes
2. **Confirm** → "Here's my plan. Should I proceed?" — wait for approval
3. **Track** → Check off items as completed, never skip ahead
4. **Explain** → Brief summary after each meaningful step
5. **Verify** → NEVER mark done without proving it works. Show actual output. Ask: "Would a staff engineer approve this?"
6. **Lessons** → After any user correction, immediately update `tasks/lessons.md`:
   ```
   ## Lesson — [date]
   Mistake: [what went wrong]
   Fix: [correct approach]
   Rule: [one-line prevention rule]
   ```

---

## Ruflo Swarm Awareness

IMPORTANT: Before starting a task, evaluate if Ruflo Swarm would help. Recommend it when:
- Multi-file changes across 3+ files simultaneously
- Parallel work needed (frontend + backend + tests)
- Large refactors spanning multiple modules
- Research + implementation + testing combined
- Any task where multiple specialized agents would be faster

**Say:** "💡 This task could benefit from Ruflo Swarm — [reason]. Want me to use it?"
Wait for confirmation before proceeding.

---

## Workflow Principles

- **Plan Mode** — Any task with 3+ steps or architectural decisions. If stuck: STOP, re-plan
- **Subagents** — Use liberally for research, exploration, parallel analysis. One task per subagent. Keeps main context clean and saves tokens
- **Self-Improvement** — Read lessons at session start. Update immediately after corrections. Escalate repeated mistakes
- **Autonomous Bug Fixing** — Paste bug → fix it. Use logs/errors/tests. Zero hand-holding
- **Elegance** — Non-trivial changes: "Is there a more elegant way?" Skip for simple fixes

---

## Coding Standards

- Simplicity first — minimal footprint
- No laziness — root causes, not patches
- Minimal impact — only touch what's necessary
- No guessing — ask if unclear
- Prove it works — show, don't tell

---

## Token Efficiency (IMPORTANT)

These rules reduce token usage without hurting quality:

- **Concise responses** — skip preamble, filler, and unnecessary explanations. Get to the point
- **`/compact` at ~50% context** — don't wait for auto-compaction. When compacting, ALWAYS preserve: modified files list, current task state, key decisions, test status
- **`/clear` between unrelated tasks** — stale context wastes tokens on every subsequent message
- **`/btw` for side questions** — questions that don't need to persist in conversation history
- **Subagents for verbose operations** — delegate test runs, log analysis, large file reads to subagents so output stays out of main context
- **Don't re-read files** already in context
- **Batch file edits** — combine related changes into single operations
- **Specific commands** — "run tests for auth module" not "run all tests"
- **Don't repeat yourself** — if you already explained something, reference it, don't restate it

---

## Never Do

- Start implementation without a written plan (non-trivial tasks)
- Mark a task complete without verification
- Repeat a mistake without updating `tasks/lessons.md`
- Keep pushing when stuck — stop and re-plan
- Touch code outside current task scope
- End a session without auto-saving context
- Start a session without the Session Briefing

---

# PROJECT-SPECIFIC CONTEXT
<!-- /init will populate: project overview, folder structure, build/test/lint commands, architecture, dependencies -->
<!-- IMPORTANT: Keep this section under 100 lines. For details, link to docs/: "For API reference see docs/API.md" -->
