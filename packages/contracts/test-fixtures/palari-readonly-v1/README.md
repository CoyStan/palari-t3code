# Palari Read-Only Fixture v1

This directory is a T3-owned deterministic integration fixture. Every person,
company, goal, source, and work item is fictional. It is not an export of a
Palari workspace, an APP ticket, a GitHub issue, or customer data.

Compatibility is pinned to:

- Palari Company OS commit `e651a3e9c9cacfc584d507a75cf3152df860d9d4`
- package version `0.1.2`
- workspace schema version `1`
- agent packet schema `palari.agent_packet.v1`

`workspace.json` is the Company OS source of truth. `overview.json` is the
expected normalized T3 response; it deliberately contains no source URI,
filesystem path, command, branch, commit, external URL, raw attempt, or raw
subprocess output.

## Provider-free validation

From the T3 repository, with the pinned Company OS checkout as a sibling:

```bash
../palari-company-os/bin/palari \
  --workspace packages/contracts/test-fixtures/palari-readonly-v1 \
  validate --json

../palari-company-os/bin/palari \
  --workspace packages/contracts/test-fixtures/palari-readonly-v1 \
  queue --json

../palari-company-os/bin/palari \
  --workspace packages/contracts/test-fixtures/palari-readonly-v1 \
  agent brief WORK-FIXTURE-002 \
  --as PALARI-FIXTURE-LUMEN --mode execute --json
```

All three commands are reads. Do not substitute `agent start` for `agent
brief`: `start` persists a packet and local claim.

## Fingerprint

The compatibility proof hashes every regular file in the copied workspace,
including optional `.palari` runtime/history files and split collection files
when present. It sorts relative filenames using the C locale, hashes each file,
then hashes the ordered manifest:

```bash
(
  cd packages/contracts/test-fixtures/palari-readonly-v1
  find . -type f -print0 \
    | LC_ALL=C sort -z \
    | xargs -0 sha256sum \
    | sha256sum
)
```

Tests copy the directory to a temporary location before invoking Company OS,
then require the before and after fingerprints to be identical. The recorded
hash belongs in `docs/palari/evidence/fixture-fingerprint.json`, outside this
hashed directory, so the evidence is not self-referential.
