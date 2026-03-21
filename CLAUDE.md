# Claude Instructions — Referee Tool

## FIRST THING EVERY SESSION
Read these files before doing anything else:
- `.claude-memory/PROJECT_STATE.md` — current project state, decisions, terminology
- `.claude-memory/POSTGRES_STATE.md` — Postgres migration status

## LAST THING EVERY SESSION
Update those memory files with anything that changed.

## Key Rules
- User is a professional DBA — never explain SQL or database concepts
- Always commit and push to GitHub after changes — live at referee-tool.com in ~30-60 seconds
- Referee cards are called **dog tags** — always
- Never reference Netlify — hosting is GitHub Pages + GoDaddy
- Read files without asking permission first
- Do not summarize what you just did at the end of responses
- Notifications and mobile features belong in the Postgres backend — not the frontend
