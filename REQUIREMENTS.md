# Product Requirements Document (PRD)

## 1. Introduction
This document outlines the requirements for the MVP of the BW Tracker PWA. The goal is to migrate core tracking features from a 30+ column Excel sheet into a mobile-friendly web application with offline resilience.

## 2. User Stories (MVP Scope)

### Epic 1: Daily Tracking & Resilience
* **US 1.1:** As an athlete, I want to log my morning weight, sleep duration, and sleep quality so that I can track my baseline recovery.
* **US 1.2:** As an athlete, I want to log my daily steps, cardio minutes, and gym session rating (RPE, Energy).
* **US 1.3:** As an athlete, I want to submit an "End of Day" check-in (water intake, digestion, stress) easily from my phone.
* **US 1.4:** As an athlete, I want my logged data to save locally if I lose internet connection at the gym, and I want a manual "Sync" button to push that data to the server when I'm back online.

### Epic 2: Diet & Nutrition
* **US 2.1:** As an athlete, I want to view my assigned meals and macro targets for the current day so that I know exactly what to eat.
* **US 2.2:** As an athlete, I want to check off meals as I eat them to track my daily adherence.

### Epic 3: Food Database & Smart Swaps
* **US 3.1:** As an athlete, I want to search a database of approved foods to check their macros per 100g.
* **US 3.2:** As an athlete, I want to swap a food in my meal plan for another food and have the app **automatically calculate the new weight** needed to hit the same primary macro target.

## 3. Architecture & Database Specs
* **Offline Strategy:** "Mainly online + manual sync button". 
* **Local Storage:** Dexie (IndexedDB) acts as a staging queue for failed mutations (e.g., `create_daily_log`).
* **Supabase Strategy:** Relies on client-side UUID generation and idempotent `UPSERT` operations keyed by `UNIQUE(user_id, date)` to handle safe retries from the offline queue.

## 4. Out of Scope for MVP
* Full, real-time, conflict-resolving offline-first sync engine (we are using the lightweight IndexedDB queue instead).
* Complex charting and trends graphs (Planned for Phase 3).
* Push notifications.