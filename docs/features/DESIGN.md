# Leonida — Landing Page & Registration Design Spec

> Design system: **The Performance Manifesto**
> Reference: `docs/landing-page-design-manifesto.md`
> Scope: `/` (landing), `/register`, `/login`

---

## Design System Quick Reference

| Token | Value | Use |
|-------|-------|-----|
| `primary` | `#000000` | Headlines, rules, primary buttons |
| `leonida-red` | `#b52619` | Intensity, CTAs, error states, accent |
| `gold` | `#4b3900` | Achievements, milestones (not landing page) |
| `surface` | `#ffffff` | Page background |
| `surface-container-low` | `#f2f2f2` | Section backgrounds, plan card fill |
| `surface-container-high` | `#d6d6d6` | Active states, hover surfaces |
| `on-primary` | `#ffffff` | Text on black |

**Typography stack:**
- `display` / `headline`: Newsreader or Playfair Display — serif, editorial weight
- `body`: Source Serif 4 — long-form, high legibility
- `label` / `ui` / `data`: JetBrains Mono or Space Grotesk — monospace, all-caps for labels

**Hard rules from manifesto:**
- `border-radius: 0` everywhere — no exceptions
- No `box-shadow` — depth via tonal stacking only
- No center-aligned long-form text
- Binary Inversion on all interactive elements (hover: colors invert)
- Thin-stroke geometric icons only (1px stroke, no fills)
- 4px black rules to open/close major sections

---

## Page 1 — Landing (`/`)

### Overall layout

Strict single-column vertical flow. Full-width sections stacked. Max content width: `1200px`, centered. Left-aligned grid inside.

Background: `surface` (`#ffffff`) throughout. Section transitions via background color shift — never ruled borders.

---

### Section 1 — Hero

**Background:** black-to-near-black tonal gradient (`#000000` → `#3b3b3b`). Full viewport height on desktop, 90vh on mobile.

**Layout:**
```
[sticky nav bar — see below]

                                         LEONIDA          ← display-lg, Newsreader, white, right-aligned
                                                          ← oversized, bleeds slightly off viewport edge

— — — — — — — — — — — — — — — — — — — —                  ← 4px white rule, full width, 40% opacity

DISCIPLINE.                                               ← headline-xl, Newsreader, white, left col
TRACK. FUEL.                                              ← headline-xl, continuation
PERFORM.                                                  ← headline-xl, in Leonida Red

                        The tool your coach uses.         ← body-lg, Source Serif 4, white 70%, right col
                        The app you live in.              ← body-lg, continuation


[GET STARTED ▶]            [SIGN IN →]                   ← CTAs, left-aligned, see button spec below

— — — — — — — — — — — — — — — — — — — —                  ← 4px white rule, full width, bottom of hero
```

**Asymmetric intent:** "LEONIDA" title is right-aligned and oversized (allow 2–3 characters to clip viewport). The left column (manifesto lines) and right column (subtitle) sit in a 60/40 grid split.

---

### Sticky Nav Bar

Triggered after 80px scroll. Before scroll: transparent, no background.

After scroll: `surface` (`#ffffff`) at 85% opacity, `backdrop-blur: 16px`. Full-width 1px black rule bottom border.

```
LEONIDA                                    [SIGN IN]   [GET STARTED]
```

- `LEONIDA` — label-md, JetBrains Mono, all-caps, black
- `[SIGN IN]` — ghost button (black outline, black text)
- `[GET STARTED]` — primary button (black fill, white mono text)
- No logo icon. Name is the mark.

---

### Section 2 — The Method (3 principles)

**Background:** `surface` (`#ffffff`).
**Opening rule:** 4px black rule, full width.

Three columns on desktop, stacked on mobile. Each column:

```
01.                     ← display-sm, Newsreader, black — oversized number, anchor element
TRACK                   ← headline-md, Newsreader

Every morning. Every rep.
Every meal. One place.  ← body, Source Serif 4, left-aligned

—                       ← 2px Leonida Red rule, 40px wide, bottom of copy
```

Copy:
- `01. TRACK` — Morning weight, sleep, training, end-of-day. Offline-first. Syncs when ready.
- `02. FUEL` — Weekly meal plan. Smart food swaps. Macro targets. No guessing.
- `03. PERFORM` — Charts, streaks, trends. See what's working. Adjust.

---

### Section 3 — Plans

**Background:** `surface-container-low` (`#f2f2f2`).
**Opening rule:** 4px black rule.
**Header:**

```
YOUR PLAN.              ← headline-lg, Newsreader, left
YOUR TERMS.             ← headline-lg, Newsreader, left, next line

No payment. No trial. Choose and start now.  ← body, Source Serif 4
```

**Plan cards — grid:** 4 columns on desktop, 2×2 on tablet, 1 column on mobile.

Each card:

```
┌────────────────────────────┐
│ SELF-COACHED               │  ← label-sm, JetBrains Mono, all-caps
│                            │
│ Solo athlete.              │  ← headline-sm, Newsreader
│ You set the rules.         │
│                            │
│ ✓  Daily log               │  ← body-sm, Source Serif 4
│ ✓  Diet tracker            │     thin checkmark (1px stroke, geometric)
│ ✓  History & charts        │
│ ✗  AI planning             │     ✗ = muted, 40% opacity
│ ✗  Coach panel             │
│                            │
│ [GET STARTED →]            │  ← full-width button, bottom of card
└────────────────────────────┘
```

Card spec:
- Background: `surface` (`#ffffff`) — lifts off `surface-container-low` without a border
- No border, no shadow — tonal separation only
- Top: 4px solid rule in color per plan (see below)
- Padding: `32px`
- Button: full-width, primary style (black fill)

**Plan accent colors (top rule):**

| Plan | Top rule |
|------|----------|
| Self-coached | `#000000` black |
| Self-coached + AI | `#b52619` Leonida Red |
| Coach | `#000000` black |
| Coach Pro | `#b52619` Leonida Red |

**Plan card copy:**

| Plan | Title | Tagline | Limits |
|------|-------|---------|--------|
| Self-coached | SELF-COACHED | Solo athlete. You set the rules. | No AI, no coach panel |
| Self-coached + AI | SELF-COACHED + AI | Solo athlete. With an edge. | AI diet & training, no coach panel |
| Coach | COACH | Your athletes. Your system. | Up to 5 athletes, no AI |
| Coach Pro | COACH PRO | Full squad. Full power. | Up to 25 athletes + AI |

Feature rows (✓/✗):

| Feature | Self | Self+AI | Coach | Coach Pro |
|---------|:---:|:---:|:---:|:---:|
| Daily log | ✓ | ✓ | ✓ | ✓ |
| Diet tracker | ✓ | ✓ | ✓ | ✓ |
| History & charts | ✓ | ✓ | ✓ | ✓ |
| Workout log | ✓ | ✓ | ✓ | ✓ |
| AI diet planning | ✗ | ✓ | ✗ | ✓ |
| AI workout planning | ✗ | ✓ | ✗ | ✓ |
| Coach dashboard | ✗ | ✗ | ✓ | ✓ |
| Athlete management | ✗ | ✗ | Up to 5 | Up to 25 |

"Coach Pro" card is slightly wider or visually emphasised — use `surface-container-high` background instead of `surface` to differentiate without decoration.

---

### Section 4 — Manifesto Pull Quote

**Background:** `#000000` (black). Full-bleed.
**Opening rule:** 4px Leonida Red rule.

```
"The only metric that               ← display-md, Newsreader, white
matters is the one                  ← continuation
you logged today."                  ← last line in Leonida Red
```

Right-aligned. No other content. This section is a pause — purely typographic.

---

### Section 5 — Footer

**Background:** `surface-container-low`.
**Opening rule:** 4px black rule.

```
LEONIDA                             ← label-lg, JetBrains Mono, all-caps

Already have an account?  SIGN IN → ← body-sm + link in Leonida Red

                          Contact   ← muted links, right side
                          Privacy
```

Two-column: brand left, links right. Minimal. No social icons.

---

## Page 2 — Registration (`/register`)

### Layout

Single column, centered. Max width `480px`. Background `surface`.

Top: `LEONIDA` wordmark — label-lg, JetBrains Mono, left-aligned, links to `/`.
Below wordmark: 4px black rule, full width of the form container.

**Plan badge** (if coming from landing `?plan=`):

```
● COACH PRO                         ← label-sm, JetBrains Mono, all-caps
                                       dot in Leonida Red if AI plan, black otherwise
```

**Invite badge** (if coming from `?invite=`):

```
INVITED BY                          ← label-xs, JetBrains Mono, muted
Marco Rossi                         ← body, Source Serif 4
```

---

### Step indicator

```
━━━━━━━━━━━━━━━━━━━━━━━━▸ · · ·    ← horizontal rule, filled = done, dot = upcoming
ACCOUNT  BODY  FUEL  DRIVE          ← label-xs, JetBrains Mono, all-caps, spaced under rule
```

Filled segment: 2px black. Upcoming: 1px `surface-container-high`. Active dot: Leonida Red.

---

### Step 0 — Account

```
YOUR ACCOUNT                        ← headline-sm, Newsreader

EMAIL                               ← label-sm, JetBrains Mono, all-caps
__________________________________  ← 1px bottom rule input (no box)
↳ "An account with this email exists. Sign in →"  ← error in Leonida Red if duplicate

PASSWORD
__________________________________

[CONTINUE →]                        ← primary button, full width, black fill
```

Input spec (from manifesto):
- No four-sided box — 1px bottom rule only (`outline` token)
- Label: `label-sm`, JetBrains Mono, all-caps, above field
- Error: bottom rule transitions to Leonida Red `#b52619`, 2px weight

---

### Step 1 — BODY

```
BODY                                ← headline-sm, Newsreader
Baseline math.                      ← body-sm, Source Serif 4, muted

SEX
[MALE]  [FEMALE]  [OTHER]           ← segmented buttons, binary inversion on select

DATE OF BIRTH
__________________________________  ← DD / MM / YYYY, bottom-rule input
Age autocalculated and shown below field: "28 years old" in mono

HEIGHT                     [CM | FT]
[——●——————————] 178 cm              ← slider + live numeric display, unit toggle right

CURRENT WEIGHT             [KG | LBS]
[———●—————————] 82 kg

PRIMARY GOAL
[LOSE FAT] [RECOMP] [BUILD MUSCLE] [MAINTAIN]

INTENSITY                           ← collapsed by default, tap "Set intensity →" to expand
[—●———————] Conservative → Aggressive
           Moderate (default)

[CONTINUE →]
```

Slider spec:
- Track: 2px black rule
- Thumb: 12px black square (0 radius)
- Active segment: black fill
- Inactive: `surface-container-high`

Segmented button spec:
- Selected: black background, white mono text
- Unselected: white background, black border (1px), black text
- No radius

---

### Step 2 — FUEL

```
FUEL                                ← headline-sm, Newsreader
Plan adherence.                     ← body-sm, muted

DIET FRAMEWORK
[OMNIVORE] [PESCATARIAN] [VEGETARIAN] [VEGAN]

MEALS PER DAY
[3]  [4]  [5+]

HARD NO'S                           ← label-sm, JetBrains Mono
Select all that apply. We will never suggest these.

[LACTOSE]   [GLUTEN]    [NUTS]
[FISH]      [EGGS]      [SHELLFISH]
[SOY]       [NONE ✓]    ← pre-selected; deselects all others when tapped

[CONTINUE →]
```

Chip/multi-select spec:
- Unselected: white, 1px black outline, 0 radius
- Selected: black fill, white mono text
- "NONE" chip: pre-selected on load; selecting any allergen auto-deselects "NONE"

---

### Step 3 — DRIVE

```
DRIVE                               ← headline-sm, Newsreader
Activity & volume.                  ← body-sm, muted

LIFESTYLE ACTIVITY
[DESK       ] — Mostly sitting. Office or study.
[LIGHT      ] — Regular walks, some movement.
[MODERATE   ] — Physical job or regular sport.
[VERY ACTIVE] — Manual labour or 2× training/day.
                ← stacked segmented rows, full width, with description inline

GYM DAYS / WEEK
[2]  [3]  [4]  [5]  [6]

[FINISH →]                          ← primary button, Leonida Red fill (#b52619) on final step
                                       white mono text
```

DRIVE activity rows: each row is a full-width selectable row — label left, description right, binary inversion on select.

---

### Completion state

After submit, while `/auth/complete-registration` processes:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← animated scanning rule, Leonida Red, left→right

BUILDING YOUR PLAN                  ← headline-sm, Newsreader
```

Redirect to `/tracker` or `/dashboard` once complete. No spinner — animated horizontal rule only.

---

## Page 3 — Login (`/login`)

Minimal. Same container as registration.

```
LEONIDA                             ← wordmark
————————————————————————————————    ← 4px black rule

WELCOME BACK                        ← headline-sm, Newsreader

EMAIL
__________________________________

PASSWORD
__________________________________

[SIGN IN →]                         ← primary button, full width

No account? Choose a plan →         ← body-sm, link in Leonida Red, links to /
```

---

## Interaction Model Summary

| State | Behaviour |
|-------|-----------|
| Button hover | Binary inversion: black→white bg, white→black text, 2px black outline appears |
| Button active/press | 4px black rule appears on bottom edge ("heavy press") |
| Input focus | Bottom rule weight: 1px → 2px black |
| Input error | Bottom rule: 2px Leonida Red |
| Chip selected | Black fill, white text |
| Segmented selected | Black fill, white text |
| Link hover | Underline appears, color stays |
| Plan card hover | `surface` → `surface-container-low` background shift (no transform, no shadow) |

---

## Responsive Behaviour

| Breakpoint | Change |
|-----------|--------|
| `< 768px` | Plan cards: 1 column stack. Hero: tagline moves below title. Section 2: columns stack. |
| `768–1024px` | Plan cards: 2×2 grid. Hero: reduced type scale. |
| `> 1024px` | Full layout as specced above. |

Mobile-first build. The registration form is already single-column — no responsive changes needed there.

---

## Fonts — Implementation Notes

Load via `@fontsource-variable` (already in project for Geist). Add:

```bash
npm install @fontsource/newsreader @fontsource-variable/source-serif-4 @fontsource/jetbrains-mono
```

Tailwind `theme.extend.fontFamily`:
```js
display: ['Newsreader', 'Georgia', 'serif'],
body: ['Source Serif 4', 'Georgia', 'serif'],
mono: ['JetBrains Mono', 'Courier New', 'monospace'],
```

Landing page and registration only — the tracker/dashboard apps keep their current Geist font. The manifesto aesthetic applies exclusively to public-facing pages.
