# BW Tracker — Project Overview

## What It Is

A mobile-first Progressive Web App (PWA) used by an athlete and their coach to track daily fitness metrics, nutrition, and training.

## Users

| Role | Access |
|------|--------|
| **Athlete** | Mobile tracker app (`/`), workout log (`/workout`) |
| **Coach** | All of the above + dashboard panel (`/dashboard/*`) |
| **Self-coached** | Athlete + limited coach capabilities (goal setting) |

## Three Apps in One Codebase

The frontend is a single Vite/React build that routes to three distinct apps:

- **Tracker** (`/`) — Daily log (morning biometrics, training, end-of-day), diet viewer, history, stats
- **Dashboard** (`/dashboard/*`) — Coach panel: athlete overview, progress charts, diet management, AI planning
- **Workout** (`/workout/*`) — Workout logging, program management, session history, analytics [WIP]

## Current State (March 2026)

| Area | Status |
|------|--------|
| Tracker app (all tabs) | Shipped |
| Coach dashboard (Phases 0–2) | Shipped |
| AI diet planner (backend) | Shipped |
| Workout app | WIP scaffolding |
| Push notifications | Planned |

## Key Design Constraints

- **Mobile-first**: Primary use is on phone, at the gym
- **Offline-resilient**: Writes queue locally (Dexie/IndexedDB) and sync manually
- **Single athlete focus**: No multi-tenancy complexity on athlete side; coach manages 1–N athletes
- **Italian diet section**: Meal/food names are intentionally in Italian (coach's language)

## Related Documents

- `REQUIREMENTS.md` — Original MVP user stories
- `ROADMAP.md` — Phased implementation task list
- `FEATURE_BRAINSTORM_SYNTHESIS.md` — AI planner feature design
- `WORKOUT_APP_WIP.md` — Workout app spec
- `docs/architecture.md` — System architecture deep-dive
