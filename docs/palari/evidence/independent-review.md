# Independent Review

Status: **ACCEPT**

Review date: 2026-07-14

## Reviewed scope

- Branch: `palari/company-os-readonly-bridge-v0`
- T3 base: `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`
- Committed integration head at review: `54adb2ebd70826f3ee0a405a87043ebb296db090`
- Company OS: `e651a3e9c9cacfc584d507a75cf3152df860d9d4`
- Scope: the first three integration commits plus the uncommitted final
  hardening, compatibility expectations, evidence, and screenshots intended
  for the fourth local commit.

A fresh specialist independently inspected authority separation, mutation
risk, path and subprocess boundaries, schemas and normalization, redaction,
capability skew, UI claims, accessibility, test coverage, screenshots, bundle
impact, and upstream compatibility.

## Findings and dispositions

The first review returned `REJECT` with five findings. Repeat review also found
one final identity-binding gap. Every finding was repaired and re-reviewed:

1. **Workspace-file symlink containment — resolved.** `workspace.json` and
   every declared split collection file are canonicalized, contained, and
   required to be regular files before any Company OS CLI read. Main-file and
   split-file symlink-escape tests fail closed.
2. **Opaque and bound identities — resolved.** The configured workspace ID is
   a bounded opaque identifier. Queue workspace, packet workspace, packet work
   item, and packet Palari identity must match the validated query.
3. **Closed raw governance values — resolved.** Every consumed governance
   status uses the pinned literals or a checked approval-progress pattern;
   unknown values return a schema-incompatibility status.
4. **Current-version persisted-state validation — resolved.** An always-applied
   merge boundary rejects corrupt right-panel surfaces and persisted action
   injection while preserving live store actions.
5. **Literal-false capability decoding — resolved.** Omitted
   `palariCompanyOsRead` now decodes to `false`, with old/new compatibility
   expectations covered.
6. **Agent-packet Palari binding — resolved.** The packet's validated
   `agent.id` must equal the Palari used for the server-derived `--as` argument;
   a wrong-agent packet fails with `packet_schema_mismatch`.

No new substantive findings remain.

## Independent verification

- Final focused repaired suite: 52/52 passed.
- Broader focused suite during repeat review: 92/92 passed.
- Palari Chromium project: 5/5 passed.
- `vp run typecheck`: all 15 package checks passed.
- `vp check`: 0 errors and the same nine baseline React warnings.
- `git diff --check`: passed.
- Recorded full monorepo tests and production builds passed.
- Bundle evidence remained within every budget: initial JavaScript +1,946
  bytes gzip, CSS +14 bytes gzip, lazy Palari chunk 6,361 bytes gzip.
- Desktop and mobile evidence remained representative because the review
  repairs did not alter rendered panel behavior.

The reviewer confirmed that the browser cannot select paths, identifiers, or
operations; only `queue` and `agent-brief` are allowlisted; no mutation path or
control exists; subprocess execution is bounded and redacted; raw CLI objects
do not cross normalization; and the authority, authorization, observability,
accessibility, focus, responsive, and overflow boundaries are appropriate.

## Accepted residual risks

- The queue envelope is unversioned, so every Company OS revision change needs
  a deliberate compatibility review.
- Windows process-tree cleanup needs revalidation before a Windows distribution
  claim.
- The configured local checkout and workspace are operator-controlled trust
  inputs; filesystem replacement races are outside this local v0 boundary.
- Only deterministic fictional workspaces have been exercised.
- Company OS writes, APP import, GitHub synchronization, live systems, and real
  workspace adoption remain explicitly deferred.

## Verdict

**ACCEPT.** The read-only v0 boundary is coherent, tested, visibly bounded, and
ready for the founder's local dogfood decision without authorizing any write,
push, pull-request, merge, deployment, import, or live-system action.
