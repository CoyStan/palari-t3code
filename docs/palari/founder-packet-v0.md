# Founder Packet: Palari Company OS Read-Only Bridge v0

Status: **draft — implementation evidence and independent acceptance pending**

This packet must not be treated as approval to push, merge, deploy, import live
records, or add Company OS write operations. Final status is reached only when
the completion contract is fully checked with committed evidence.

## Exact baseline

- T3 Code base: `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526`
- Company OS: `e651a3e9c9cacfc584d507a75cf3152df860d9d4`
- Company OS package: `0.1.2`
- Workspace schema: `1`
- Agent packet: `palari.agent_packet.v1`
- T3 bridge protocol: `1`
- Local branch: `palari/company-os-readonly-bridge-v0`

## Founder-facing outcome

The intended v0 outcome is a compact read-only Palari panel inside T3. It shows
what governance work needs attention, which Palari is assigned, safe boundary
counts, proof/review readiness, and explicit human-decision states. T3 remains
usable if Company OS is disabled, absent, invalid, stale, or incompatible.

The browser never reads Company OS files and never receives unrestricted
command access, raw paths, source URIs, generated commands, or raw subprocess
output.

## Authority architecture

```text
T3 browser
  -> typed palari.readOverview request
  -> authenticated T3 server bridge
  -> exact checkout/workspace validation
  -> fixed queue / agent-brief allowlist
  -> pinned repository-local Company OS CLI
  -> strict raw validation and field-by-field normalization
  -> bounded read-only panel
```

- Company OS owns governance records and permissions.
- T3 owns interactive agent execution and session state.
- Git owns branches, commits, diffs, and worktrees.
- GitHub owns pull requests, hosted reviews, and merges.

The bridge displays references and derived status without duplicating these
authorities.

## Current evidence

| Evidence                                               | State                    | Location                                          |
| ------------------------------------------------------ | ------------------------ | ------------------------------------------------- |
| Company OS 337-test verification and offline demo      | Prepared; commit pending | `docs/palari/evidence/company-os-verification.md` |
| Official-example unchanged fingerprint                 | Prepared; commit pending | `docs/palari/evidence/company-os-verification.md` |
| Fictional fixture validation and unchanged fingerprint | Prepared; commit pending | `docs/palari/evidence/fixture-fingerprint.json`   |
| T3 unit, type, lint, and integration checks            | Pending                  | `docs/palari/evidence/checks.md`                  |
| Desktop and mobile visual evidence                     | Pending                  | `docs/palari/evidence/desktop.png`, `mobile.png`  |
| Bundle comparison                                      | Pending                  | `docs/palari/evidence/bundle-impact.json`         |
| Fresh independent review                               | Pending                  | `docs/palari/evidence/independent-review.md`      |

## Known risks to close before acceptance

- Company OS queue JSON is unversioned; exact checkout pinning and strict raw
  schemas must therefore fail closed on drift.
- Raw Company OS output can contain absolute workspace paths, commands, source
  URIs, branches, commits, and external references. Tests must prove none can
  cross the normalization boundary.
- Subprocess cancellation, timeout, output bounds, and environment isolation
  need platform-aware automated coverage.
- The sibling-repository configuration is local by design and requires clear
  recoverable status when a checkout or workspace moves.
- Browser accessibility, focus restoration, responsive overflow, and bundle
  budgets still require captured evidence.

## Intentionally deferred

- Any Company OS mutation, including claim/start/release.
- Work finish, review record, human acceptance, merge, push, deploy, or external
  provider actions.
- APP-ticket import and live Palari/beta/customer data.
- GitHub issue, pull-request, review, or merge synchronization.
- Browser workspace selection or browser-supplied command parameters.
- Multiple Company OS workspaces.
- Raw Company OS detail/history/proof payloads.
- Hosted Company OS, background runners, secret use, and paid providers.

## Future mapping proposal — not implemented

| External concept                      | Later Company OS representation                                                 | Authority rule                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| APP ticket                            | Explicitly imported proposal or bounded work item with its original external ID | No existing APP ticket is presumed to be a Company OS record; a human must approve the import contract and adoption |
| T3 thread or provider session         | Reference from a Company OS execution attempt                                   | Session activity does not create governance authority or imply acceptance                                           |
| Git branch, worktree, commit, or diff | Attempt/evidence reference                                                      | Git remains authoritative for the actual repository state                                                           |
| GitHub PR, hosted review, or merge    | External reference attached to evidence/review context                          | GitHub remains authoritative for PR and merge state; a PR does not replace a Company OS human decision              |

## Recommended Phase 2

1. The founder creates and approves a real Company OS workspace for this
   project; do not transform existing tickets implicitly.
2. Define a versioned, idempotent APP-ticket import contract with provenance,
   conflict handling, dry-run output, and explicit human adoption.
3. Add read-only work-item detail plus explicit T3 session/attempt linkage.
4. Design Git/GitHub reference ingestion without copying their authority.
5. Keep all mutation operations deferred until a separate human-authorized
   write protocol, threat model, rollback contract, and independent review are
   complete.

## Founder decision required at v0 close

After every completion-contract item is evidenced and independent review says
`ACCEPT`, the founder may decide whether the read-only bridge is suitable for
local dogfood. That decision still does not authorize APP import, Company OS
writes, push, merge, deployment, or live-system access.
