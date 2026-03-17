# Dashboard Expansion Blueprint: Diet & Goal Tracking

This document outlines the blueprint for adding a comprehensive Dashboard to the existing app, designed for both normal users and coaches. It allows them to track progress, manage diets and food items, and set goals. The features are built on the existing tech stack (React/TypeScript, Tailwind CSS, Supabase) and optimized for both desktop and mobile views.

This blueprint is the result of a parallel brainstorming session by our expert agent team.

---

## 🧭 Product Manager Perspective (@agency-product-manager)

### 1. Problem Statement
Users and coaches lack a centralized hub to monitor long-term progress, set actionable goals, and manage nutritional plans. While the current app captures daily logs, it needs a strategic layer (the Dashboard) to turn raw data into actionable insights and structured dietary plans.

### 2. Goals & Success Metrics
| Goal | Metric | Target |
|------|--------|--------|
| Increase user retention | 30-day return rate | +15% |
| Coach adoption | % of users linking with a coach | 20% |
| Goal completion | % of users hitting weekly goals | 60% |

### 3. User Personas & Stories
- **Persona 1: The Driven User.** Wants to see their progress visualized and manage their own diet plan.
  - *Story:* As a user, I want to input my custom diet and daily food items so that I can track my macro adherence against my goals.
- **Persona 2: The Coach.** Manages multiple clients, sets their goals, and adjusts their diets.
  - *Story:* As a coach, I want to edit my clients' assigned diets and view their progress dashboard to provide timely feedback.

### 4. Core Features
- **Progress Hub**: Visual charts for weight, macros, and habit adherence.
- **Diet & Food Manager**: Create/edit meals, add custom food items, and assign them to days.
- **Goal Setter**: Define target weight, macro splits, and timeline.

---

## 📐 UX Architect Perspective (@agency-ux-architect)

### 1. Information Architecture
The dashboard will introduce a new top-level navigation structure, prioritizing a seamless transition between mobile and desktop contexts.
- **Overview (Home)**: High-level widgets (Current progress vs. Goal, Today's Macros).
- **Diet Plan**: Weekly view of assigned diets and meals.
- **Food Database**: Search, add, and edit custom food items.
- **Coach Portal (If applicable)**: Client list and quick-status indicators.

### 2. Layout Framework
- **Mobile (Default)**: Stacked cards, sticky bottom action bar for quick updates, and swipeable elements for charts.
- **Desktop (Enhanced)**: Sidebar navigation, multi-column grid layout (e.g., Progress charts on the left 2/3, Quick actions & Today's diet on the right 1/3).

### 3. Component Hierarchy
1. **Layout**: `DashboardLayout` (handles sidebar/bottom nav context).
2. **Widgets**: `ProgressChartWidget`, `GoalTrackerWidget`, `DietAdherenceWidget`.
3. **Interactive**: `FoodEditorModal`, `GoalSettingWizard`.

---

## 🏗️ Backend Architect Perspective (@agency-backend-architect)

### 1. Core Services & APIs
To support the dashboard, we will introduce specialized logic while maintaining the existing Supabase backend stack:
- **Progress RPCs**: Database functions to aggregate daily logs into weekly/monthly trends efficiently.
- **Diet Management**: Endpoints/Queries to manage diet templates, meal assignments, and custom food items.
- **Role-Based Access Control (RBAC)**: Essential for the Coach/User dynamic. A coach must have authorized access to read/write specific client records.

### 2. Security & Data Protection
- Row Level Security (RLS) in Supabase will be updated to handle the `coach_id` relationship.
- A user can read/write their own data (`auth.uid() = user_id`).
- A coach can read/write data for users where `users.coach_id = auth.uid()`.

### 3. Caching & Performance
- Progress aggregation can be expensive natively on the client. We will implement database views or use Supabase `pg_cron` to calculate 7-day and 30-day rolling averages so the dashboard loads instantly on the frontend.

---

## 🎨 UI Designer Perspective (@agency-ui-designer)

### 1. Visual Hierarchy & Data Display
- **Charts & Graphs**: Use a dedicated lightweight charting library (like Recharts) styled with Tailwind to match the app's existing design system. Focus on clean lines, gradient fills under trend lines, and clear axis markers.
- **Data Tables**: For the Food Database and Coach Client List, use responsive data tables that intuitively convert to card-lists on mobile devices.

### 2. Interactive States
- **Goal Setting**: Use a prominent progress ring component (SVG) to show how close the user is to their goal.
- **Diet Editing**: Drag-and-drop interfaces limit mobile usability; instead, employ simple tap-to-move context menus on mobile, and drag-and-drop explicitly constrained to the desktop layout.

### 3. Responsive Strategy
- **Breakpoints**: 
  - `< 768px (Mobile)`: Stacked view. Expandable accordions for diet details to save vertical space.
  - `768px - 1024px (Tablet)`: 2-column masonry or grid view for widgets.
  - `> 1024px (Desktop)`: 3-column view, maximizing data visibility without scrolling. Side navigation replaces bottom tabs.

---

## 🗄️ Database Optimizer Perspective (@agency-database-optimizer)

### 1. Schema Extensions
We need to extend the current schema to support goals, diets, and foods without creating N+1 issues during data fetching.

```sql
-- Food Items Library
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null if global/system food
    name VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fats DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for quick lookups by user
CREATE INDEX idx_food_items_user_id ON food_items(user_id);
-- Fast text search index for food name
CREATE INDEX idx_food_items_name_search ON food_items USING gin(to_tsvector('english', name));

-- Diet Plans
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id), -- Coach ID
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_diet_plans_user_active ON diet_plans(user_id) WHERE is_active = true;

-- User Goals
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_weight DECIMAL(5,2),
    target_date DATE,
    daily_calorie_target INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Query Optimization
To populate the dashboard efficiently, we avoid N+1 queries by aggregating data directly in the database. 

```sql
-- Optimal query for dashboard progress over the last 30 days
EXPLAIN ANALYZE
SELECT 
    date_trunc('day', created_at) as log_date,
    AVG(weight_fasting) as avg_weight,
    -- Aggregating diet adherence boolean into a success rate
    COUNT(*) FILTER (WHERE diet_adherence = true)::FLOAT / COUNT(*) * 100 as adherence_rate
FROM daily_logs
WHERE user_id = 'user-uuid' AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
```
*Action Plan*: Ensure a composite index exists on `daily_logs(user_id, created_at)` to make this time-series query execute in milliseconds.
