# Founder Packet: Palari Company OS Visual Panel v1

Status: **independently accepted; ready for founder acceptance**

This packet will be completed only after the stacked visual candidate is
committed, verified, independently accepted, pushed, and opened as a PR against
`palari/company-os-readonly-bridge-v0`. It never authorizes merge, deployment,
real workspace access, provider use, GitHub synchronization, or Company OS
writes.

## Foundation

- Accepted v0 head: `5df5eae0d1eb012fb1d30c276342a0c7fcdc8c60`
- Pinned T3 baseline: `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`
- Foundation PR: `https://github.com/CoyStan/palari-t3code/pull/1`
- Visual branch: `palari/company-os-visual-panel-v1`
- Initial visual candidate: `e826dc38492089c427046729d44e2b8f47f33655`
- Independently accepted visual product commit:
  `d1e6ee76bf1e20698dd00c0a3e40b74cb5ca54f3`
- Stacked visual PR: `https://github.com/CoyStan/palari-t3code/pull/2`

The visual branch is rooted directly at accepted v0. It does not alter the v0
commit, server adapter, typed protocol, Company OS authority, Git/GitHub
authority, or the read-only command surface.

## Product result

The Palari surface is now a compact operational governance rail:

- typographic Palari identity and explicit Company OS connection state;
- founder attention before workspace totals and governed work;
- attention-first items with assigned Palari, workbench, and next step;
- count-only scope and proof rather than filesystem paths;
- explicit evidence, receipt, review, acceptance, and approval readiness;
- clear human-authority language without any decision or mutation action;
- Refresh as the only operational control;
- an active-Palari inline width cap of 28rem while other T3 surfaces retain
  their existing widths.

No proprietary image, registry component, runtime dependency, broad custom CSS
layer, gradient, or separate dashboard was added.

## Evidence

- Visual contract: `docs/palari/visual-panel-v1-contract.md`
- Design reference: `docs/palari/visual-panel-v1-design.md`
- Checks: `docs/palari/evidence/visual-panel-v1/checks.md`
- Bundle: `docs/palari/evidence/visual-panel-v1/bundle-impact.json`
- Review: `docs/palari/evidence/visual-panel-v1/independent-review.md`
- Screenshots: six ready/empty/unavailable desktop/mobile PNGs under
  `docs/palari/evidence/visual-panel-v1/`

Verification at the accepted product commit passed:

- `vp check` with zero errors and only nine unrelated existing warnings;
- all 15 `vp run typecheck` package checks;
- 50/50 focused view-state assertions;
- 12/12 Palari Chromium scenarios;
- 150 web test files and 1,333 tests;
- the production web build and `git diff --check`; and
- the accepted bundle budgets: +2,168 bytes initial JavaScript gzip from the
  pinned baseline, +283 bytes CSS gzip, and a 9,724-byte lazy Palari chunk.

The initial independent review returned `CHANGES_REQUESTED` for two semantic
claims. The accepted product commit repaired both with regressions, and the
fresh exact-head re-review returned **ACCEPT** with no findings.

## Residual risks and recommendation

Current residual risks:

- The visual layer is verified against fictional, provider-free fixtures, not
  a founder-approved real Company OS workspace.
- Company OS remains a single configured workspace and read-only v0 protocol.
- The sibling Company OS repository independently advanced beyond the accepted
  compatibility pin; the bridge correctly fails closed until an exact pinned
  checkout is configured.
- Full-shell capture of a fresh, unpromoted T3 draft emits the existing T3
  orchestration-detail `404`; no Palari-only browser scenario emits a console
  error.
- A user can still intentionally maximize the shared right panel through T3's
  existing global layout control.

Recommendation: founder-accept the visual product commit as the reviewed
candidate in stacked draft PR #2. Keep PR #2 based on the accepted v0 branch
until foundation PR #1 is merged, and do not merge or deploy either PR as part
of this handoff.
