# T3 Verification Evidence

Status: **pass**

All commands below ran from the T3 checkout on
`palari/company-os-readonly-bridge-v0`. Company OS provider-free verification
is recorded separately in `company-os-verification.md`.

## Toolchain and pins

- Node: `v24.13.1`
- Vite+: `v0.2.2` (Vite `8.1.2`, Vitest `4.1.9`)
- pnpm through Corepack: `11.10.0`
- T3 pinned base: `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`
- Company OS checkout: `e651a3e9c9cacfc584d507a75cf3152df860d9d4`
- Company OS pre-existing untracked `docs/company/` remained present and was
  not modified.

Dependencies were installed with `vp i`. The only added packages are web
development dependencies for the narrowly scoped Chromium project; no runtime
dependency was added.

## Automated checks

| Check                                       | Result | Evidence summary                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted contracts/shared/server tests      | Pass   | 48 tests across seven files covered protocol skew, path and split-file containment, identity binding, closed governance enums, process environment/cancellation, adapter failure modes, redaction, fixture compatibility, and unchanged workspace fingerprint. |
| Targeted client/UI tests                    | Pass   | Query caching/manual refresh, right-panel singleton/migration, view ordering and display-state tests passed; 29 right-panel tests include corrupt current-version persisted state.                                                                             |
| `vp run --filter @t3tools/web test:browser` | Pass   | 5 Chromium scenarios passed: desktop, mobile, keyboard surface selection/refresh, Escape/focus restoration, announcements, long-label wrapping, overflow, and absence of mutation controls.                                                                    |
| `vp check`                                  | Pass   | 0 errors; all 2,095 files formatted. Nine `react(no-unstable-nested-components)` warnings remain in existing `ChatMarkdown.tsx` and `CommandPalette.tsx`; the untouched pinned base emits the same nine warnings.                                              |
| `vp run typecheck`                          | Pass   | All 15 package checks passed. Existing advisory Effect suggestions remain in unrelated client-runtime and desktop files.                                                                                                                                       |
| `vp run test`                               | Pass   | Full repaired-tree monorepo run passed. Salient suites: web 150 files / 1,285 tests; server 162 passed files plus 2 skipped / 1,419 passed tests plus 7 skipped; all contract, shared, client-runtime, mobile, desktop, relay, and tool packages passed.       |
| `vp run build`                              | Pass   | Web, marketing, server bundle, and desktop production builds passed. Existing large-chunk and desktop sourcemap advisory warnings remain visible.                                                                                                              |

Two earlier full-suite attempts exposed a 15-second timeout while dynamically
loading the pre-existing `MessagesTimeline` test module under monorepo load.
The file passed in isolation, but the integration did not leave the full check
red. Its module is now loaded and awaited once in that file's setup hook with a
30-second setup-only allowance; the individual test timeout and assertions are
unchanged. The subsequent complete `vp run test` passed.

After the independent review hardening changed omitted capability decoding to
literal `false`, a full run correctly exposed three legacy test fixtures that
still expected the property to be absent. Their decoded expectations were
updated without changing production behavior. Targeted reruns passed, followed
by the complete repaired-tree run recorded above.

## Runtime and visual verification

A temporary copy of the fictional fixture was used with the pinned sibling CLI
and server-only environment configuration. A full T3 instance displayed the
ready Palari panel, manual Refresh completed, and the browser received the
normalized two-item overview.

- Desktop viewport: 1,440 × 900; document and body `scrollWidth` equaled
  `clientWidth` at 1,440.
- Mobile viewport: 390 × 844; document and body `scrollWidth` equaled
  `clientWidth` at 390.
- No Palari-attributable console error, page error, or failing HTTP response was
  observed during the final capture.
- Visual inspection found no overlap, clipping, horizontal overflow, or design
  system mismatch.
- Evidence: `desktop.png` and `mobile.png`.

The T3 collaborative preview service was tried first, but both `preview_status`
and `preview_open` returned `Auth required`. The installed repository Playwright
browser was therefore used as the documented fallback for full-app capture;
the T3-native Palari Chromium component project remained the authoritative
interaction test.

## Workspace immutability and feature isolation

- The fictional fixture fingerprint remained
  `b8894c81ff122baef685bf5655fb271d57c6428c076f007460134c849aeb192e`
  before and after queue plus both packet reads.
- Disabled configuration uses the bridge's non-failing default service and does
  not advertise or render the Palari action.
- No native mobile file changed, so `vp run lint:mobile` was not required.
- No live workspace, APP record, customer/provider content, secret, paid
  provider, GitHub synchronization, push, PR, merge, or deployment was used.
