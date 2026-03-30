# Design: Project Folder Reorganization

**Date:** 2026-03-30
**Status:** Approved

---

## Goal

Reorganize the project root so that each concern lives in its own clearly named top-level directory: `frontend/`, `backend/`, `supabase/`, `docs/`. The current root mixes React build config, source code, environment files, and stale documentation at the same level, making the repo hard to navigate.

---

## Final Structure

```
bw-tracker/                         ← repository root
├── CLAUDE.md                       ← stays (Claude Code requires root location)
├── README.md                       ← stays (convention)
├── vercel.json                     ← stays + updated paths
├── .gitignore                      ← stays + explicit frontend/ paths added
│
├── frontend/                       ← NEW — all React/Vite/TypeScript files
│   ├── src/                        ← moved from root src/
│   ├── public/                     ← moved from root public/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── components.json
│   ├── .env
│   └── .env.local
│
├── backend/                        ← unchanged
├── supabase/                       ← unchanged
│
├── docs/                           ← existing, expanded
│   ├── old/                        ← NEW subfolder for stale root docs
│   │   ├── CHANGELOG.md
│   │   ├── ROADMAP.md
│   │   ├── REQUIREMENTS.md
│   │   ├── FIXES.md
│   │   ├── DIET_PLANNER_BRAINSTORM.md
│   │   ├── FEATURE_BRAINSTORM_SYNTHESIS.md
│   │   ├── UI_INTERACTION_SCHEMA.md
│   │   ├── WORKOUT_APP_WIP.md
│   │   ├── WORKOUT_PLANNER_BRAINSTORM.md
│   │   └── deployment-review.md
│   └── (existing docs/ contents stay in place)
│
└── tasks/                          ← stays
```

---

## What Moves

| From (root) | To |
|---|---|
| `src/` | `frontend/src/` |
| `public/` | `frontend/public/` |
| `index.html` | `frontend/index.html` |
| `package.json` | `frontend/package.json` |
| `package-lock.json` | `frontend/package-lock.json` |
| `vite.config.ts` | `frontend/vite.config.ts` |
| `vitest.config.ts` | `frontend/vitest.config.ts` |
| `tsconfig.json` | `frontend/tsconfig.json` |
| `tsconfig.app.json` | `frontend/tsconfig.app.json` |
| `tsconfig.node.json` | `frontend/tsconfig.node.json` |
| `eslint.config.js` | `frontend/eslint.config.js` |
| `components.json` | `frontend/components.json` |
| `.env` | `frontend/.env` |
| `.env.local` | `frontend/.env.local` |
| `CHANGELOG.md` | `docs/old/CHANGELOG.md` |
| `ROADMAP.md` | `docs/old/ROADMAP.md` |
| `REQUIREMENTS.md` | `docs/old/REQUIREMENTS.md` |
| `FIXES.md` | `docs/old/FIXES.md` |
| `DIET_PLANNER_BRAINSTORM.md` | `docs/old/DIET_PLANNER_BRAINSTORM.md` |
| `FEATURE_BRAINSTORM_SYNTHESIS.md` | `docs/old/FEATURE_BRAINSTORM_SYNTHESIS.md` |
| `UI_INTERACTION_SCHEMA.md` | `docs/old/UI_INTERACTION_SCHEMA.md` |
| `WORKOUT_APP_WIP.md` | `docs/old/WORKOUT_APP_WIP.md` |
| `WORKOUT_PLANNER_BRAINSTORM.md` | `docs/old/WORKOUT_PLANNER_BRAINSTORM.md` |
| `deployment-review.md` | `docs/old/deployment-review.md` |

## What Stays at Root

| File | Reason |
|---|---|
| `CLAUDE.md` | Claude Code reads project instructions from root |
| `README.md` | Convention — first thing seen on GitHub |
| `vercel.json` | Vercel reads deployment config from root |
| `.gitignore` | Git reads from root |
| `tasks/` | Dev task notes, not frontend-specific |

---

## Config File Updates

### `vercel.json`

```json
{
  "buildCommand": "cd frontend && npm run build",
  "installCommand": "cd frontend && npm install && cd ../backend && uv pip install --system -r requirements.txt && cd ..",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/$1"
    }
  ]
}
```

No change to `rewrites` — `backend/` stays at root and Vercel discovers Python functions from there.

### `.gitignore` — no changes needed

The existing bare-name entries (`node_modules`, `dist`, `.env`, `.env.local`) already match files anywhere in the tree, including inside `frontend/`. No edits required.

### `CLAUDE.md` (root)

Update `dev_server_cmd`:
```yaml
dev_server_cmd: "cd frontend && npm run dev"
```

### `.claude/CLAUDE.md`

Update all `src/` path references to `frontend/src/` in the Architecture Overview and Directory Structure sections. This includes:
- All `src/core/`, `src/apps/`, `src/shell/` references in prose and the directory tree
- The `dev_server_cmd` example commands

### `vite.config.ts` — no changes needed

The `@/` alias uses `path.resolve(__dirname, './src')`. After the move, `__dirname` resolves to `frontend/`, so `./src` correctly points to `frontend/src/`. No edit required.

---

## Implementation Notes

- Use `git mv` for all moves to preserve git history.
- Move `src/` and `public/` as directories in one `git mv` each.
- The `node_modules/` directory is git-ignored and does not need to be moved — run `npm install` from `frontend/` after the restructure.
- The `dist/` directory is git-ignored and does not need to be moved.
- After the move, `npm run dev` / `npm run build` must be run from `frontend/`, not root. Vercel handles this via the updated `vercel.json`.
