# CLAUDE.md

## 🚀 Session Start (MANDATORY — Do This Before Anything Else)

Run the following shell commands immediately when a session begins:

```bash
mkdir -p tasks
touch tasks/todo.md tasks/lessons.md
```

Then, in this exact order:
1. Read `tasks/todo.md` — understand exactly where the previous session stopped
2. Read `tasks/lessons.md` — internalize all lessons before doing anything
3. Check if `tasks/session_context.md` exists — if yes, read it for full context

Then confirm to the user:
> "✅ Session initialized. Here's where we left off: [one sentence summary from tasks/todo.md]"

**Do not respond to any user request until these steps are complete.**

---

## 💾 Memory — Continuous Saving (MANDATORY throughout session)

### After Every Completed Task
Immediately after finishing any non-trivial task, update `tasks/todo.md`:
- Mark completed steps with ✅
- Add any new steps that emerged
- Note any important decisions made

### Proactive Context Snapshots
Every time you complete a meaningful unit of work (feature, bugfix, decision),
write a brief entry to `tasks/session_context.md`:

```markdown
## [time/task name]
**Done:** what was just completed
**State:** current state of the project
**Next:** what should happen next
**Key decisions:** any architectural or logic decisions made
```

This file is the "live memory" of the session — it must always reflect current reality.

---

## 🔚 Session End Protocol (MANDATORY)

When the user writes any of: `סיים`, `done`, `save`, `save session`, `bye`, `סגור`
— immediately run this checklist before responding:

### Step 1 — Update tasks/todo.md
```markdown
# Session: [date]
## ✅ Completed this session
- [list everything done]

## 🔄 In Progress (stopped mid-task)
- [anything that was started but not finished — with exact stopping point]

## 📋 Next Session — Start Here
- [ ] [first thing to do next session]
- [ ] [second thing...]

## 🗒️ Key Decisions Made
- [any architectural, logic, or design decisions]

## ⚠️ Important Context
- [anything that would be confusing without context]
```

### Step 2 — Write tasks/session_context.md
Full snapshot so next session can start immediately:
```markdown
# Session Context — [date]

## Project State
[1-2 sentences: what the project is and where it stands overall]

## What Was Done This Session
[bullet list of everything completed]

## Exact Stopping Point
[precise description — what file, what function, what line if relevant]

## What To Do Next (in order)
1. [first action]
2. [second action]
3. ...

## Active Files
[list of files that were modified or are relevant]

## Environment
[any servers running, ports, env vars needed, etc.]

## Warnings / Gotchas
[anything that could trip up the next session]
```

### Step 3 — Confirm to user
> "✅ Session saved. Next session I'll start with: [one sentence about what's next]"

---

## 📋 Task Management

Every non-trivial task follows this exact sequence — no exceptions:

### Step 1 — Write the Plan
Write a detailed plan to `tasks/todo.md` using this template:

```markdown
# Task: [Short task name]
Date: [today's date]

## Goal
[One sentence describing what success looks like]

## Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
...

## Notes
[Any assumptions, risks, or open questions]

## Review
[Filled in after completion — what worked, what didn't]
```

### Step 2 — Check In Before Building
After writing the plan, stop and say:
> "Here's my plan. Should I proceed?"

Wait for confirmation before writing any code.

### Step 3 — Track Progress
Check off each item in `tasks/todo.md` as you complete it. Never skip ahead.

### Step 4 — Explain Changes
After each meaningful step, give a brief high-level summary of what changed and why.

### Step 5 — Verify Before Marking Done
Never mark a task complete without proving it works. Run tests, check logs, or demonstrate correctness.
**Never fake results** — diff between mock and real behavior; show actual output, not "this should work."
Ask yourself: *"Would a staff engineer approve this?"*

### Step 6 — Capture Lessons
After any correction from the user, immediately update `tasks/lessons.md`:

```markdown
## Lesson — [date]
**Mistake:** [What went wrong]
**Fix:** [What the correct approach is]
**Rule:** [One-line rule to prevent this in future]
```

---

## 🧠 Workflow Principles

### #1 Plan Mode
- Enter plan mode for ANY task with 3+ steps or architectural decisions.
- If something goes sideways mid-task: **STOP. Re-plan. Don't keep pushing.**
- Use plan mode for verification steps too, not just building.

### #2 Subagent Strategy
- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- One focused task per subagent — never mix concerns.
- For complex problems, spawn more subagents rather than cramming into one context.

### #3 Self-Improvement Loop
- Read `tasks/lessons.md` at the start of every session.
- After ANY user correction: update lessons immediately, don't wait until the end.
- Write rules for yourself that prevent the same mistake from recurring.
- If the same mistake happens twice, escalate the rule (make it more prominent in lessons).

### #4 Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Use logs, errors, and failing tests as your guide.
- Zero context-switching required from the user.
- Fix failing CI tests without being explicitly told how.

### #5 Demand Elegance (Balanced)
- For non-trivial changes: pause and ask *"Is there a more elegant way?"*
- If a fix feels hacky: *"Knowing everything I know now, implement the elegant solution."*
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

---

## ⚙️ Core Coding Standards

- **Simplicity First** — Make every change as simple as possible. Minimal footprint.
- **No Laziness** — Find root causes. No temporary patches. Senior developer standards.
- **Minimal Impact** — Only touch what's necessary. Avoid introducing side effects.
- **No Guessing** — If something is unclear, ask before implementing. Wrong assumptions waste both our time.
- **Prove It Works** — Never say "this should work." Show that it does.

---

## ❌ Never Do These

- Never start implementation without a written plan for non-trivial tasks.
- Never mark a task complete without verification.
- Never make the same mistake twice without updating `tasks/lessons.md`.
- Never keep pushing when stuck — stop and re-plan.
- Never touch code outside the scope of the current task.
- Never end a session without running the Session End Protocol.
- Never start a session without reading tasks/todo.md and tasks/session_context.md first.

---

# ─────────────────────────────────────────────────────────────
# PROJECT-SPECIFIC CONTEXT
# (Generated by /init — edit manually if needed)
# ─────────────────────────────────────────────────────────────

<!-- /init will populate this section with:
  - Project overview
  - Folder structure
  - Build, test, and lint commands
  - Architecture notes
  - Key dependencies
-->
