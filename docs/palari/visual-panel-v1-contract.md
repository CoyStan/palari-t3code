# Palari Company OS Visual Panel v1 Contract

Status: **candidate verified; independent review pending**

This contract applies only to branch `palari/company-os-visual-panel-v1`,
stacked from accepted read-only bridge head
`5df5eae0d1eb012fb1d30c276342a0c7fcdc8c60`. A checkbox may be checked only
when its named evidence exists in the committed visual candidate.

## Accepted foundation preservation

- [x] The visual branch parent is exactly the accepted v0 head and the v0
      branch remains unchanged. Evidence: local Git history and
      `docs/palari/evidence/visual-panel-v1/checks.md`.
- [x] Foundation PR #1 targets `palari/main` at pinned T3 baseline
      `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526` and remains unmerged.
      Evidence: founder packet and final handoff.
- [x] No server, contract, Company OS, Git/GitHub authority, or read-only
      behavior is broadened. Evidence: diff audit and independent review.

## Visual concept and hierarchy

- [x] Accepted v0 desktop and mobile screenshots were inspected before edits.
      Evidence: `docs/palari/visual-panel-v1-design.md`.
- [x] The panel hierarchy presents Palari identity and connection first,
      founder attention second, governed work third, then scope and readiness.
      Evidence: ready screenshots and independent review.
- [x] “Read only” and last refresh remain visible but subordinate to governance
      state. Evidence: ready screenshots and browser assertions.
- [x] A typographic Palari mark and neutral Lucide icon are used; no proprietary
      or invented image asset is added. Evidence: implementation diff.
- [x] The surface uses one restrained warm identity/attention accent plus
      existing semantic success, warning, info, and error tokens across themes.
      Evidence: design spec, implementation, and visual review.

## T3 design-system fit

- [x] Existing base-mira/shadcn primitives, Lucide, aliases, and semantic tokens
      are reused without a registry addition or runtime dependency. Evidence:
      package diff, implementation, and bundle evidence.
- [x] No broad custom CSS layer, gradient, decorative blob, oversized heading,
      rainbow status treatment, or nested card stack is introduced. Evidence:
      diff audit and screenshots.
- [x] Cards, where used, have an effective radius of 8px or less. Evidence:
      computed-style browser assertion.
- [x] Refresh is the only operational control and unfamiliar icon-only controls
      have an accessible name and tooltip. Evidence: browser tests.

## Founder-facing information

- [x] Ready state communicates workspace identity, attention count, active work,
      assigned Palari, next step, scope counts, evidence, receipt, review,
      acceptance, and human-decision state. Evidence: component tests and ready
      screenshots.
- [x] Work requiring human authority is ordered first and is visually clear
      without implying that T3 can accept or mutate it. Evidence: tests and
      independent review.
- [x] Boundary information remains count-only; no path, source URI, command,
      branch, commit, PR URL, or raw attempt is rendered. Evidence: tests and
      security review.
- [x] Maximum-item and long-content views remain bounded and scannable. Evidence:
      browser tests and checks record.

## Required states

- [x] Ready with attention and ready without attention are both covered.
      Evidence: component/browser tests.
- [x] Empty workspace is covered. Evidence: tests and `empty-*.png`.
- [x] Loading and refreshing are covered with `aria-busy` and polite status.
      Evidence: browser tests.
- [x] Disabled, unavailable, incompatible, and invalid states are distinct and
      recoverable. Evidence: component tests and `unavailable-*.png`.
- [x] Cached ready data with a refresh warning remains visible. Evidence:
      component/browser tests.

## Responsive and accessibility

- [x] Desktop remains an inline panel with approximately 28rem maximum width and
      the T3 conversation remains primary. Evidence: `ready-desktop.png`.
- [x] Mobile uses the existing sheet with one vertical flow, no clipped badge,
      overlap, scroll trap, or horizontal overflow. Evidence: all mobile
      screenshots and browser assertions.
- [x] Semantic section headings, alerts, status announcements, refresh focus,
      keyboard activation, Escape close, and focus restoration pass. Evidence:
      Palari Chromium tests.
- [x] Ready, empty, and unavailable views are captured at 1440×900 and 390×844.
      Evidence: six PNGs under `docs/palari/evidence/visual-panel-v1/`.
- [x] Screenshot captures have no Palari-attributable console/page/network
      errors. Evidence: `docs/palari/evidence/visual-panel-v1/checks.md`.

## Verification and budgets

- [x] Focused view-state, component, query, and right-panel tests pass. Evidence:
      `docs/palari/evidence/visual-panel-v1/checks.md`.
- [x] `vp check`, `vp run typecheck`, relevant `vp test`, Palari Chromium tests,
      production build, and `git diff --check` pass. Evidence: checks record.
- [x] Initial JavaScript stays within the accepted 5 KiB gzip v0 delta budget,
      CSS within 2 KiB gzip, and the lazy Palari chunk within 25 KiB gzip; any
      changed delta is recorded against both pinned base and accepted v0.
      Evidence: `docs/palari/evidence/visual-panel-v1/bundle-impact.json`.
- [x] No runtime dependency is added. Evidence: package/lock diff and bundle
      evidence.

## Review and handoff

- [ ] The complete candidate is committed before final review. Evidence: exact
      reviewed commit in `independent-review.md`.
- [ ] A fresh independent design/accessibility/security reviewer returns
      `ACCEPT`, with substantive findings repaired and re-reviewed. Evidence:
      `docs/palari/evidence/visual-panel-v1/independent-review.md`.
- [ ] The visual founder packet records exact commits, both PRs, screenshots,
      checks, bundle impact, residual risks, and an acceptance recommendation.
      Evidence: `docs/palari/founder-packet-visual-v1.md`.
- [ ] The stacked PR targets `palari/company-os-readonly-bridge-v0` and neither
      PR is merged or deployed. Evidence: founder packet and final handoff.
