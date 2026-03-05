# BW Tracker PWA 🏋️‍♂️🥗

A mobile-first Progressive Web App (PWA) designed to replace a complex Excel fitness and nutrition tracking spreadsheet. Built for athletes to seamlessly log daily biometrics, view their assigned meal plans, and intelligently swap foods while automatically recalculating portion sizes to hit precise macronutrient targets.

## 🌟 The Vision
Excel is powerful but terrible to use on a mobile phone in the middle of a gym session. This PWA brings the logic of a professional coaching spreadsheet into a clean, intuitive, and fast mobile web app, built with a "resilient-online" architecture so you can log your sets even with zero cell service.

## ✨ Core Features
1. **Daily Log (Tracker Giornaliero):** Quick, categorized mobile forms to input morning biometrics, gym performance, and evening recovery metrics.
2. **My Diet (Piano Alimentare):** An interactive view of the daily meal plan based on the day of the week, with a check-off system for adherence.
3. **Smart Food Swaps (Lista Alimenti):** Select a prescribed food (e.g., 150g Chicken) and swap it with another (e.g., Salmon). The app automatically calculates the exact new weight required to hit the original protein target.
4. **Resilient Offline Logging:** A built-in local queue ensures that if you log your workout offline, it saves locally. Just hit the "Sync" button when you get back on WiFi.

## 🛠 Tech Stack
* **Frontend:** React (via Vite) for a blazing-fast Single Page Application.
* **Styling:** Tailwind CSS for rapid, mobile-first UI.
* **Backend & DB:** Supabase (PostgreSQL, Auth, and instant APIs).
* **Data Fetching & Caching:** TanStack Query.
* **Local Offline Queue:** IndexedDB (via Dexie).
* **Client State:** Zustand.

## 🚀 Getting Started
*(Instructions will be added here once the Vite project is initialized)*