# Palari Visual Panel v1 Verification

Status: **pass; independent review pending**

The commands below ran on branch `palari/company-os-visual-panel-v1`, stacked
from exact accepted v0 head
`5df5eae0d1eb012fb1d30c276342a0c7fcdc8c60`.

## Foundation attestation

- The accepted v0 branch still resolves to
  `5df5eae0d1eb012fb1d30c276342a0c7fcdc8c60`.
- The accepted v0 commit tree is
  `945c7b564276e04bd8d2237511662162e2b9df37`, matching the clean tree that
  contains the committed independent `ACCEPT` evidence.
- Remote `palari/main` remains exact pinned baseline
  `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`.
- Remote `palari/company-os-readonly-bridge-v0` remains exact accepted v0.
- Foundation PR [#1](https://github.com/CoyStan/palari-t3code/pull/1) is an
  open, unmerged draft from the accepted branch into `palari/main`.

No accepted v0 commit was amended, replaced, or mixed with visual work.

## Toolchain

- Node `24.13.1`
- Vite+ `0.2.2` (Vite `8.1.2`, Vitest `4.1.9`)
- pnpm `11.10.0`

No package manifest, lockfile, runtime dependency, server, contract, or
Company OS file changed.

## Automated checks

| Check                                | Result | Evidence summary                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused view-state suite             | Pass   | 50 assertions cover ordering, field-specific fail-closed semantic tones, label/approval formatting, and unknown-state handling.                                                                                                                                                                                                                                            |
| Palari Chromium project              | Pass   | 11 serial scenarios cover ready with/without attention, empty, loading/refreshing, all operational failures, cached warning, exact 256/512-character limits, 50 items, both themes, 28rem inline cap, desktop/mobile overflow, keyboard activation, tooltip, focus trap, Escape restoration, announcements, compact radii, no nested cards, and the one-control inventory. |
| Web unit suite                       | Pass   | 150 files / 1,333 tests.                                                                                                                                                                                                                                                                                                                                                   |
| `vp check`                           | Pass   | 2,099 files formatted; zero errors. Nine existing unrelated `react(no-unstable-nested-components)` warnings remain in `ChatMarkdown.tsx` and `CommandPalette.tsx`.                                                                                                                                                                                                         |
| `vp run typecheck`                   | Pass   | All 15 package typechecks passed; existing unrelated Effect suggestions remain advisory.                                                                                                                                                                                                                                                                                   |
| `vp run --filter @t3tools/web build` | Pass   | Production build passed with the existing large-chunk advisory.                                                                                                                                                                                                                                                                                                            |
| `git diff --check`                   | Pass   | No whitespace errors.                                                                                                                                                                                                                                                                                                                                                      |

The focused suite used `vp test`; the full web package script used
`vp run --filter @t3tools/web test`; the dedicated browser project used
`vp run --filter @t3tools/web test:browser`.

## Full-shell visual evidence

The T3 collaborative preview was attempted first. `preview_status` and
`preview_open` both reported that no automation-capable preview host was
attached, so the installed repository Playwright browser was used as the
documented fallback.

Six full T3 shell captures use only fictional, provider-free workspaces:

- `ready-desktop.png` and `ready-mobile.png`
- `empty-desktop.png` and `empty-mobile.png`
- `unavailable-desktop.png` and `unavailable-mobile.png`

For all three states:

- desktop viewport is 1,440 × 900 and inline panel width is 447px;
- mobile viewport is 390 × 844 and sheet width is 342px;
- document and body `scrollWidth` equal `clientWidth`;
- the Palari panel exposes only `Refresh Palari overview` as an operational
  control;
- no claim, start, finish, accept, merge, push, deploy, or configure control is
  present;
- no Palari page error, Palari RPC failure, or Palari HTTP failure occurred.

Each provider-free fresh-draft capture also observed one T3 orchestration
detail probe returning `404` for the unpromoted local draft route. The failing
path is `/api/orchestration/threads/<draft-id>` and occurs outside the Palari
RPC; it is recorded here rather than concealed. The Palari-only Chromium
project emitted zero console errors across all 11 scenarios.

The pinned sibling checkout had independently advanced to `2eea39e…` and had
unrelated working changes when visual verification began. It was not modified.
That checkout correctly produced the bridge's fail-closed incompatible state.
Ready and empty captures instead used a temporary local read-only checkout at
the accepted pin `e651a3e9c9cacfc584d507a75cf3152df860d9d4`.

The temporary empty workspace was fictional, validated successfully through
the pinned CLI, and returned an empty JSON queue. No live Company OS workspace,
provider, secret, APP record, or GitHub synchronization was used.

## Visual inspection

All six PNGs were inspected at original size. The ready state keeps identity,
connection, attention, workspace summary, governed work, assigned Palari,
scope, and readiness in one scannable rail. Empty and unavailable states remain
bounded. No overlap, clipped badge, horizontal overflow, nested card, broad
custom CSS layer, proprietary asset, or visually separate dashboard was found.

Bundle measurements and exact deterministic gzip deltas are in
`bundle-impact.json`.
