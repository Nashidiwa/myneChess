# Design & Engineering Standards for Online Chess

This repository has adopted:
1. The design engineering skills by Jakub Krehel (installed under `.agents/skills/` and `skills/`).
2. **Anthropic's `frontend-design` skill** (installed under `.agents/skills/frontend-design/` and `skills/frontend-design/`), governing intentional, distinctive aesthetic direction that avoids generic "AI slop" or templated defaults.

All frontend interfaces in `apps/web` must adhere to these combined design and craft principles:

## 1. Distinctive Visual Identity & Subject Grounding (`frontend-design`)
- **Grounded in Chess Reality**: The interface reflects tournament chess vernacular — precise algebraic notation, tactile board contrast, digital tournament clocks, evaluation bars, and material counts.
- **Rejecting AI Clichés**:
  - Avoid generic SaaS kits: content chopped into identical rounded cards with identical soft shadows.
  - Avoid arbitrary gradient text in headlines (e.g. half the headline colored with a purple/blue gradient).
  - Avoid uppercase tracked-out eyebrow labels (e.g., `TÍNH NĂNG NỔI BẬT` or `01 / 02`). Outlines and numbering are reserved for true sequences.
  - Avoid gratuitous "→" arrows appended to every link/button. CTAs must state exact user actions ("Vào phòng thi đấu", "Luyện tập với máy").
- **Spend boldness in one place**: Let the central chessboard arena be the memorable centerpiece; keep surroundings disciplined, calm, and readable.
- **Minimalist Copywriting**: Clear, active voice from the player's perspective. No vague marketing filler.

## 2. Visual Polish & Surfaces (`better-ui`)
- **Concentric Radii**: Outer radius equals inner radius plus padding plus border (`R_outer = R_inner + padding + border`).
- **Elevation**: Multi-layered transparent box-shadows; reserve crisp hairlines for structural separation.
- **Interactive Press**: Buttons and interactive controls must scale to `0.96` - `0.98` on active press over 150ms (`active:scale-[0.98] transition-all duration-150 ease-out`).
- **High-frequency response**: Hovers and taps respond in 150ms or less. Never use `transition: all`; name the animated properties (`transition-colors`, `transition-transform`).
- **Icons**: Match icon stroke width to text weight (stroke-width 1.75–2 for medium text). Optical alignment for play buttons and icon-only actions.

## 3. Color Tokens & Semantics (`better-colors` & `frontend-design`)
- **Deliberate Palette**:
  - `obsidian` / `slate-900`: Deep tournament graphite contrast for focus.
  - `chalk` / `slate-50`: Crisp, glare-free playing surface.
  - `board-dark` (`#4b7399` / `#6ba3c8`) & `board-light` (`#f0f5fa`): Classic high-visibility tournament squares.
  - `clock-amber` (`#d97706`): Clock countdown and urgent turn state.
  - `tactical-sky` (`#0284c7`): Selected pieces, legal move dots, and primary actions.
- **One primary action per view**: Only one filled primary button per view or section; secondary actions stay neutral with crisp borders.
- **Contrast**: Text must pass WCAG AA (minimum 4.5:1 for normal text, 3:1 for large text / non-text controls).
- **Meaning**: Never convey status by color alone—always pair with icons or clear text labels.

## 4. Typography & Numerics (`better-typography`)
- **Tabular Numbers**: Apply `tabular-nums font-mono` to chess clocks, timers, ELO ratings, move counts, and coordinate counters.
- **Scale & Tracking**: Headings at 24px+ take `-0.02em` tracking (`tracking-tight`).
- **Sentence Case**: Use sentence case for labels and actions, avoiding unnecessary all-caps.
- **Wrapping**: Use `text-wrap: balance` for headings and short descriptions; avoid solitary orphan words.
- **Mobile inputs**: Form input fonts must be at least 16px on mobile (`text-base sm:text-sm`) to prevent iOS Safari auto-zooming.

## 5. Layout & Adaptivity (`better-layout`)
- **Spacing over lines**: Group content using spacing first (`gap-4`, `gap-6`), background surfaces second, separator borders only when needed.
- **Responsive Navigation**: Full support for mobile devices with accessible hamburger navigation drawers and clear touch targets (minimum 44x44px).
- **No clip / overflow**: Containers use `min-w-0` on flex items and `overflow-x-auto` on tables and move lists.

## 6. Accessibility (`better-accessibility`)
- **Focus Rings**: All interactive controls must have visible, high-contrast keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2`).
- **Accessible Names**: All icon-only buttons (close, refresh, audio toggle, menu toggle, logout) must carry clear `aria-label` attributes.
- **Semantic HTML**: Use native `<button>` and `<dialog>` or proper ARIA roles.
