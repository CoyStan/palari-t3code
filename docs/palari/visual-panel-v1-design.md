# Palari Company OS Visual Panel v1 Design

Status: **implementation reference**

## Baseline inspection

The accepted v0 screenshots at `docs/palari/evidence/desktop.png` and
`docs/palari/evidence/mobile.png` were inspected at their original dimensions.
The v0 panel is complete and readable, but its stacked summary/boundary/work
cards give similar visual weight to every level. Four large metric tiles and a
second boundary card push the actual decision and governed work lower than the
founder-attention hierarchy calls for.

## Code-native concept

This is a small operational surface inside an established T3 design system, so
the concept is code-native rather than an image-generated dashboard. It uses no
Palari image asset and no visual material from `palari-v05`.

The panel is one vertical operational rail:

1. **Identity header** — a compact typographic `P` mark, “Palari”, explicit
   Company OS connection text, subtle “Read only”, last checked time, and one
   icon-only Refresh button with tooltip.
2. **Attention band** — a concise founder-facing decision/attention statement,
   followed by compact workspace totals rather than four large metric tiles.
3. **Governed work** — attention-first work items with title, reason, assigned
   Palari, workbench, next step, and an explicit human-authority callout when
   needed.
4. **Scope and proof** — an open, count-only boundary section and compact
   evidence/receipt/review/acceptance readiness rows. No nested card.
5. **Provenance footer** — bounded Company OS version/revision text.

Only the compact workspace summary and governed work items use bordered card
containers. Boundary, readiness, attention, and footer content remain open
sections separated by spacing or the existing Separator primitive. Effective
card radius is at most 8px.

## Visual system

- Framework: existing React/Vite/Tailwind v4 application.
- Component style: installed `base-mira`, Base UI primitives, DM Sans.
- Icons: configured Lucide family only.
- Color: one dedicated light/dark `palari` orange identity token plus existing
  semantic `background`, `foreground`, `muted`, `border`, `warning`, `success`,
  `info`, and `destructive` status tokens. Orange is used only for the
  typographic mark; it never substitutes for governance meaning.
- Radius: `rounded-md` or smaller for panel-owned containers.
- Density: 12–16px section insets, compact rows, tabular counts, 12–14px chrome
  text, and no oversized typography.
- Motion: only existing focus/hover/spinner behavior; no decorative animation.

## Visible copy inventory

Allowed persistent chrome copy:

- `Palari`
- `Company OS · Connected` or the fixed operational state label
- `Read only`
- `Last checked` / `Not checked yet`
- `Refresh Palari overview` as the accessible control name and tooltip
- `Founder decision required`, `Governance attention needed`,
  `No founder action needed`, or the bounded operational state title
- `Governed work`
- `Scope & proof`
- `Assigned Palari`, `Workbench`, `Next step`
- `Evidence`, `Receipt`, `Review`, `Acceptance`, `Boundary`
- `Human decision required`
- `No governed work`
- `Bounded view`

Workspace, work-item, Palari, workbench, objective, reason, and normalized state
labels remain data-driven from the accepted typed protocol.

## State behavior

- **Ready with attention:** warm attention band and human-decision callout;
  affected item ordered first.
- **Ready without attention:** calm current-state band; no implied action.
- **Empty:** identity header plus installed Empty primitive and compact zero
  totals; no blank card.
- **Loading/refreshing:** identity header remains stable; installed Skeleton and
  Spinner communicate progress; cached data remains visible during refresh.
- **Disabled/unavailable/incompatible/invalid:** explicit connection label plus
  installed Alert with fixed normalized message. Refresh remains the only
  possible control.
- **Cached warning:** warning Alert above retained ready content.
- **Long/maximum content:** words wrap, readiness stays compact, and individual
  work items use deferred offscreen rendering where supported.

## Responsive rules

- Desktop inherits T3’s inline right-panel shell. A narrow optional shell cap
  applies only while Palari is the active surface, keeping it at 28rem without
  changing the width of browser, terminal, file, diff, or plan surfaces.
- Mobile inherits T3’s sheet, retains the same information order, and uses
  compact wrapping rows rather than a separate dashboard layout.
- No fixed content width, horizontal scroller, clipped badge, or overlapping
  header control is allowed at 390×844.

## Fidelity checklist

Final visual comparison will inspect: identity hierarchy, attention prominence,
work-item placement, typography/density, semantic palette, 8px radius, icon
metaphor/alignment, open section rhythm, mobile wrapping, and preservation of
all required read-only copy and states.
