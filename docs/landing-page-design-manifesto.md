# Design System Strategy: The Performance Manifesto

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Performance Manifesto."** 

This is not a traditional interface; it is a high-end editorial experience designed for discipline, focus, and elite achievement. It rejects the "softness" of modern SaaS design—no rounded corners, no decorative shadows, and no unnecessary friction. It draws inspiration from luxury fashion broadsheets and Spartan military austerity.

By utilizing massive typographic scales, intentional asymmetry, and a strictly vertical linear flow, we break the "template" look. This system treats the screen as a physical canvas where white space is as functional as the content itself.

---

## 2. Colors & Tonal Depth
The palette is rooted in absolute contrast. We use a "Binary Foundation" where the interplay between light and dark creates a sense of authority.

### Color Role Mapping
*   **Primary (`#000000`)**: Used for the most critical information, heavy rules, and high-impact headlines.
*   **Secondary (`#b52619`)**: The "Leonida Red." Use this exclusively for moments of high effort, intensity, or "blood in the game."
*   **Tertiary (`#4b3900` / Gold)**: Reserved for achievements and milestones. It is the "Medal" color.
*   **Surface Hierarchy**: We use `surface-container` tiers to create depth without shadows.

### The "No-Line" Rule for Layout
While this system uses black rules for expression, **prohibit 1px solid borders for standard sectioning.** Do not box in your content. Instead, define boundaries through background color shifts. A `surface-container-low` section sitting against a `surface` background creates a clear, sophisticated transition that feels architectural rather than "boxed."

### Signature Textures & Gradients
To avoid a flat, "default" digital look, use subtle tonal gradients on large surfaces. A transition from `primary` (#000000) to `primary-container` (#3b3b3b) on a hero section adds a "tactile ink" quality that pure hex black lacks.

---

## 3. Typography: The Editorial Voice
Typography is the primary vehicle for the brand’s soul. We use a tri-font system to establish a rigorous hierarchy.

*   **Display & Headline (`newsreader` / Playfair Display)**: These are massive and unapologetic. Use `display-lg` (3.5rem) for hero statements. Headlines should feel like newspaper mastheads—high contrast and authoritative.
*   **Body (`notoSerif` / Source Serif 4)**: Designed for long-form reading. The serif choice maintains the editorial "fashion" vibe while ensuring high legibility for manifesto-style content.
*   **Metadata (`spaceGrotesk` / JetBrains Mono)**: All UI labels, timestamps, and technical data must use the Monospace font. This creates a "system-level" contrast against the poetic serifs, suggesting precision and data-driven discipline.

---

## 4. Elevation & Depth: Tonal Layering
In a system with **zero radius** and **zero shadows**, depth is achieved through "Tonal Stacking."

*   **The Layering Principle**: Treat the UI as layers of fine paper. Place a `surface-container-lowest` card on a `surface-container-low` background to create a "lift" through color value alone.
*   **The "Ghost Border"**: When containment is functionally required (e.g., input fields), use the `outline-variant` token at 20% opacity. It should be felt, not seen.
*   **Glassmorphism**: For floating elements like sticky headers, use a semi-transparent `surface` with a heavy `backdrop-blur`. This allows the massive typography to bleed through the header as the user scrolls, maintaining the "luxury fashion" editorial feel.

---

## 5. Components
All components must adhere to the **Binary Inversion** interaction model: when an element is touched or hovered, its colors invert (Black becomes White, Red becomes Black).

### Buttons
*   **Primary**: Pure Black (`#000000`), 0px radius, 1.4rem padding. Text is `on-primary` (Monospace).
*   **State**: On hover/active, the button inverts to White with a 2px Black rule.
*   **Tactile Feedback**: Use the 4px rule on the bottom of buttons for a "Heavy" press state.

### Input Fields
*   **Style**: No four-sided boxes. Use a 1px bottom rule (`outline`).
*   **Labels**: Use `label-sm` (Monospace) always in uppercase.
*   **Error State**: Transition the bottom rule to `secondary` (#b52619) with a 2px weight.

### Cards & Lists
*   **Constraint**: Forbid divider lines between list items. Use vertical white space from the **Spacing Scale** (e.g., `8` - 2.75rem) to separate entries.
*   **Hero Cards**: Use a `surface-container-highest` background with a massive serif number (e.g., 01.) in the top left corner to anchor the eye.

### Sticky Section Headers
*   **Visual**: Use `label-md` Monospace text. The header must be sticky, utilizing a 1px black rule that spans the full width of the viewport, creating a "scanning" effect as the user moves through the content.

---

## 6. Do's and Don'ts

### Do
*   **Do** use massive, oversized typography that occasionally overlaps background elements for an editorial look.
*   **Do** embrace vertical linearity. The user should feel like they are reading a scroll of honor.
*   **Do** use the 4px heavy rules to "anchor" the bottom of a page or the top of a major new section.

### Don't
*   **Don't** ever use a border-radius. Every corner must be a sharp 90-degree angle.
*   **Don't** use drop shadows. If an element needs to stand out, use a high-contrast background color or a 2px black rule.
*   **Don't** use "standard" iconography. If an icon is needed, it should be thin-stroke (1px) and strictly geometric. Avoid rounded icon sets.
*   **Don't** use center alignment for long-form text. Stick to a disciplined left-aligned grid or purposeful asymmetrical offsets.

---

**Director’s Final Note:**
This system is about the power of what is *not* there. By stripping away the "decorations" of modern UI—shadows, rounds, and glows—we force the user to confront the content. Every pixel must earn its place. Be disciplined. Be austere. Be elite.