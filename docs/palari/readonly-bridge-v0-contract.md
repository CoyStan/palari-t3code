# Palari Company OS Read-Only Bridge v0 Completion Contract

Status: **complete**

A checkbox may be checked only after its evidence is committed on
`palari/company-os-readonly-bridge-v0`. Prepared but uncommitted artifacts do
not satisfy a checkbox. Failures and deferred work must remain visible.

## Repository and dependency orientation

- [x] T3 is confirmed at base `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`,
      the official source remote is named `upstream`, and the integration branch is
      `palari/company-os-readonly-bridge-v0`.
      Evidence: `docs/palari/company-os-orientation.md` and local commit history.
- [x] The sibling Company OS checkout is confirmed at
      `e651a3e9c9cacfc584d507a75cf3152df860d9d4`, with pre-existing unrelated
      changes preserved and no integration change made there.
      Evidence: `docs/palari/evidence/company-os-verification.md`.
- [x] Repository instructions, package roles, package manager, required Node
      and Vite+ versions, test commands, and Company OS agent/product docs were
      inspected.
      Evidence: `docs/palari/company-os-orientation.md` and
      `docs/palari/evidence/checks.md`.
- [x] Exact Company OS CLI inputs and observed JSON schemas are documented
      without invented fields or commands.
      Evidence: `docs/palari/company-os-orientation.md`.

## Pinned compatibility

- [x] The adapter hard-pins Company OS revision
      `e651a3e9c9cacfc584d507a75cf3152df860d9d4`, package `0.1.2`, workspace
      schema `1`, packet schema `palari.agent_packet.v1`, and bridge protocol `1`.
      Evidence: contracts, adapter constants, and their tests.
- [x] A wrong Git revision, wrong workspace schema, wrong packet schema, and
      unsupported bridge protocol each fail closed with a typed redacted status.
      Evidence: adapter test output in `docs/palari/evidence/checks.md`.
- [x] No moving Company OS branch is consulted at runtime.
      Evidence: adapter tests and `docs/palari/company-os-orientation.md`.

## Architecture and trust boundaries

- [x] The browser calls only the typed T3 RPC; it cannot invoke Company OS or
      choose a filesystem path, work ID, Palari ID, or CLI operation.
      Evidence: contracts, server handler, client query, and tests.
- [x] The server invokes only the `queue` and `agent-brief` allowlist through
      argument arrays, with no shell interpolation.
      Evidence: adapter implementation and allowlist tests.
- [x] T3, Company OS, Git, and GitHub authority remains separate and is stated
      accurately in both product copy and architecture docs.
      Evidence: orientation, panel copy, and founder packet.
- [x] Company OS absence, invalid configuration, or incompatibility cannot
      prevent normal T3 startup or use.
      Evidence: disabled/unavailable integration tests.

## Deterministic fixture workspace

- [x] The first compatibility smoke uses a temporary copy of the official
      Company OS example; committed examples and dogfood data remain unchanged.
      Evidence: `docs/palari/evidence/company-os-verification.md`.
- [x] The smaller T3-owned fixture is explicitly fictional, contains no APP,
      customer, provider, or live Palari data, and validates through the pinned
      Company OS CLI.
      Evidence: `packages/contracts/test-fixtures/palari-readonly-v1/`.
- [x] Queue and both ready and human-blocked packet reads leave every fixture
      file unchanged.
      Evidence: `docs/palari/evidence/fixture-fingerprint.json`.
- [x] The expected normalized overview contains none of the prohibited raw
      CLI fields.
      Evidence: `packages/contracts/test-fixtures/palari-readonly-v1/overview.json`
      and contract tests.

## Typed protocol

- [x] `palari.readOverview` has schema-validated protocol-version input and a
      discriminated `ready | disabled | unavailable | incompatible | invalid`
      result.
      Evidence: `packages/contracts/src/palari.ts` and tests.
- [x] Environment capabilities add an optional, decode-default-false
      `palariCompanyOsRead` field that is safe across old/new client skew.
      Evidence: capability contract and version-skew tests.
- [x] Ready payloads enforce 50-item, string-length, safe-SHA, and 256 KiB
      normalization bounds.
      Evidence: contract and adapter tests.
- [x] Operational errors contain only a fixed code, fixed bounded message, and
      retryability; raw stderr, argv, environment, and paths are absent.
      Evidence: redaction tests.

## Server adapter

- [x] Company OS is invoked only on the T3 server from the configured pinned
      checkout.
      Evidence: adapter implementation and architecture tests.
- [x] Checkout, workspace root, and workspace target are canonicalized; path
      traversal, sibling-prefix attacks, and symlink escapes fail closed.
      Evidence: shared path helper and regression tests.
- [x] CLI reads time out after 5 seconds, Git revision probes after 2 seconds,
      combined output is limited to 1 MiB, and cancellation cleans up owned child
      processes.
      Evidence: process-runner and adapter tests.
- [x] Company OS subprocesses inherit no ambient environment beyond the
      explicit platform/runtime allowlist and deterministic Python locale values.
      Evidence: subprocess environment test.
- [x] Queue and packet data are strictly validated and normalized field by
      field; no raw object is spread into the RPC payload.
      Evidence: adapter implementation and forbidden-field tests.
- [x] RPC authorization uses the orchestration read scope and observability is
      aggregated under `palari`.
      Evidence: RPC registration tests or code inspection recorded in independent
      review.

## UI vertical slice

- [x] A lazy-loaded singleton Palari right-panel surface is capability-gated
      and uses the environment-scoped query.
      Evidence: right-panel/state tests and production bundle output.
- [x] The panel shows attention, assignments, safe scope counts, evidence,
      receipt, review, acceptance, and human-decision state without raw paths or
      commands.
      Evidence: screenshots and UI tests.
- [x] Every control is observational; no claim, start, finish, accept, merge,
      push, deploy, or workspace-mutation control appears.
      Evidence: browser tests and independent review.
- [x] Loading, empty, cached-refresh-warning, disabled, unavailable,
      incompatible, and invalid states are bounded and recoverable.
      Evidence: component tests.
- [x] Existing T3 design primitives and tokens are reused without a separate
      dashboard application or custom CSS layer.
      Evidence: implementation inspection and bundle evidence.

## Tests and failure behavior

- [x] Automated coverage passes for successful and empty reads, invalid
      workspace, missing checkout/CLI/workspace, revision/protocol/schema mismatch,
      malformed JSON, timeout, cancellation, oversized output, invalid path,
      symlink escape, disallowed operation, redaction, unchanged fingerprint, and
      disabled T3 behavior.
      Evidence: `docs/palari/evidence/checks.md`.
- [x] Contract tests cover capability version skew, unknown variants, response
      bounds, and truncation indicators.
      Evidence: `docs/palari/evidence/checks.md`.
- [x] Query and UI tests cover caching, refresh, persistence migration,
      attention ordering, all display states, and absence of mutation controls.
      Evidence: `docs/palari/evidence/checks.md`.

## Security and redaction

- [x] Browser payloads contain no local checkout/workspace path, source URI,
      command string, branch, commit, external URL, raw attempt, or subprocess
      output.
      Evidence: forbidden-field tests and expected overview fixture.
- [x] Sensitive-looking errors and environment values are redacted under every
      process failure mode.
      Evidence: redaction tests.
- [x] No `.env`, secret, live system, provider, customer content, or real
      Company OS workspace was accessed.
      Evidence: independent review and founder packet.

## Accessibility and responsive behavior

- [x] The panel is semantically labelled, exposes loading/status/alert states,
      and is usable from the keyboard.
      Evidence: Palari-only Chromium tests.
- [x] Refresh works by Tab/Enter, and the mobile sheet closes with Escape and
      restores focus.
      Evidence: Palari-only Chromium tests.
- [x] Desktop 1440×900 and mobile 390×844 renders have no overlap, clipping, or
      horizontal overflow, including long labels.
      Evidence: `docs/palari/evidence/desktop.png`,
      `docs/palari/evidence/mobile.png`, and browser assertions.

## Bundle and upstream compatibility

- [x] No runtime dependency is added and the panel remains lazy-loaded.
      Evidence: lockfile/package diff and `bundle-impact.json`.
- [x] Relative to the clean pinned base, initial JS grows by at most 5 KiB
      gzip, the lazy Palari chunk is at most 25 KiB gzip, and CSS grows by at most
      2 KiB gzip.
      Evidence: `docs/palari/evidence/bundle-impact.json`.
- [x] Existing T3 behavior and persisted right-panel data migrate safely when
      Palari is disabled or an older server is used.
      Evidence: regression and version-skew tests.

## Required verification

- [x] Pinned Company OS `./scripts/verify.sh` and offline demo pass.
      Evidence: `docs/palari/evidence/company-os-verification.md`.
- [x] `vp check` passes.
      Evidence: `docs/palari/evidence/checks.md`.
- [x] `vp run typecheck` passes.
      Evidence: `docs/palari/evidence/checks.md`.
- [x] `vp run test` and targeted Palari tests pass.
      Evidence: `docs/palari/evidence/checks.md`.
- [x] Relevant production builds and the Palari-only Chromium project pass.
      Evidence: checks, screenshots, and bundle evidence.

## Review and founder decision packet

- [x] A fresh independent reviewer returns `ACCEPT` after all substantive
      findings are repaired.
      Evidence: `docs/palari/evidence/independent-review.md`.
- [x] Residual risks and intentionally deferred capabilities are explicit.
      Evidence: `docs/palari/founder-packet-v0.md`.
- [x] The founder packet contains exact pins, architecture, verification,
      screenshots, bundle impact, risks, deferred APP/GitHub mapping, and a
      recommended next phase.
      Evidence: `docs/palari/founder-packet-v0.md`.
- [x] Every checkbox above is supported by committed evidence; the branch has
      not been pushed, merged, deployed, or used to open a pull request.
      Evidence: local Git history and final status report.
