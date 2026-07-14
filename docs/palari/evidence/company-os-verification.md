# Company OS Verification Evidence

Date: 2026-07-14 UTC

## Pinned input

- Repository revision: `e651a3e9c9cacfc584d507a75cf3152df860d9d4`
- Package version: `0.1.2`
- Python: `3.12.3`
- Git: `2.43.0`
- Provider credentials used: none
- Network-dependent install smoke used: no

The sibling checkout already contained the unrelated untracked directory
`docs/company/`. It was not read for the integration, altered, staged, or
removed. No tracked Company OS file changed.

## Repository verification

Command, run from the pinned Company OS checkout:

```text
./scripts/verify.sh
```

Result:

```text
Ran 337 tests in 57.747s
OK
Style check passed.
Palari Company OS verification passed.
```

The script covered unit tests, compilation, JSON validity, style, and the
documented CLI smokes. The separate `scripts/install_smoke.sh` was intentionally
not used as offline evidence because it may attempt package-index access.

## Provider-free demo

Command, with `<temp>` denoting a newly created temporary directory:

```text
./bin/palari demo --dir <temp>/demo --no-pause --json
```

Result: exit code 0 with `schema_version: palari.demo.v1`. The demo reported the
blocked out-of-bound change, the passing in-bound change, and the human handoff.
The temporary directory was removed after inspection.

The demo JSON embeds generated absolute command paths. Those paths are omitted
from this evidence and must never be returned by the T3 bridge.

## Official example compatibility smoke

The official `examples/acme-company-os` directory was copied to a temporary
directory. The committed example was not modified.

Commands against the copy:

```text
./bin/palari --workspace <temp>/workspace validate --json
./bin/palari --workspace <temp>/workspace queue --json
./bin/palari --workspace <temp>/workspace agent brief WORK-0003 --as PALARI-SOFIA --mode execute --json
```

Observed result:

- validation: `valid: true`, 7 work items;
- queue: 6 open items, first attention `needs-human-decision`;
- packet: `palari.agent_packet.v1`, `status: ready`;
- before fingerprint: `b7ec3dc0a5c00d8849d8d40f44b9f71298c6dd53a7c4aaac020e8f39df175114`;
- after fingerprint: `b7ec3dc0a5c00d8849d8d40f44b9f71298c6dd53a7c4aaac020e8f39df175114`.

The matching hashes prove the three reads did not change any regular file in
the copied official workspace.

## T3-owned fixture smoke

The fictional fixture validated successfully and returned two queue items:

- `WORK-FIXTURE-002`: `needs-human-decision`, AI unsafe to proceed;
- `WORK-FIXTURE-001`: `ready-for-ai-work`, AI safe inside its packet boundary.

The ready packet for `WORK-FIXTURE-001` reported:

- packet schema `palari.agent_packet.v1`;
- one selected source;
- two read paths and one write path;
- five effective forbidden actions after Palari and work-item rules were
  combined;
- a receipt requirement, with no review or human-decision requirement for the
  light R2 receipt path.

The blocked packet for `WORK-FIXTURE-002` reported:

- blocker `HUMAN_DECISION_REQUIRED`;
- one read path, one write path, and one selected source;
- six effective forbidden actions;
- receipt, evidence, review, and human-decision requirements;
- `external_writes_allowed: false`.

The final fixture hash and exact commands are recorded in
`fixture-fingerprint.json`.
