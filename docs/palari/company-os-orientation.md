# Palari Company OS Orientation

## Pinned baseline

| Component          | Pin                                        | Role                                         |
| ------------------ | ------------------------------------------ | -------------------------------------------- |
| T3 Code            | `c1ec1915fc16f3dc1ec5d47d9a97f6210a574526` | Interactive execution cockpit                |
| Palari Company OS  | `e651a3e9c9cacfc584d507a75cf3152df860d9d4` | Governance and orchestration source of truth |
| Company OS package | `0.1.2`                                    | Repository-local Python CLI                  |
| Workspace schema   | `1`                                        | File-backed workspace contract               |
| Agent packet       | `palari.agent_packet.v1`                   | Bounded agent context contract               |
| T3 bridge protocol | `1`                                        | Normalized browser-facing adapter contract   |

The Company OS security document named `docs/product/security-notes.md` in the
initial brief has moved to `docs/product/security.md` at the pinned revision.

## What Company OS is

Palari Company OS is a local, file-backed operating contract around
human-supervised AI work. Its records make intent, selected context, allowed
changes, current attempts, proof, independent review, and human authority
inspectable.

Its normal lifecycle is:

```text
goal -> workbench -> selected sources -> bounded work item -> attempt
  -> receipt and evidence -> independent review when required
    -> human decision when required -> outcome
```

The canonical workspace is `workspace.json` plus optional workspace-relative
split collection files. `.palari/history.jsonl` is append-only audit evidence,
not the source of current governance truth. Queue, state, detail, dashboards,
and agent packets are derived read models.

Company OS fails closed on unknown workspace fields, invalid references,
unsupported lifecycle values, stale proof, missing authority, and out-of-scope
paths. Light R1/R2 local work can become `receipt-ready` with a valid receipt,
but `receipt-ready` is still a human-facing handoff, not acceptance or
completion.

## What Company OS is not

Company OS is not:

- a chatbot, model provider, or background agent runner;
- the Palari customer application;
- a replacement for T3 sessions, terminals, diffs, or worktrees;
- a Git branch or commit database;
- a GitHub pull-request or merge database;
- a source of automatic human acceptance;
- a live connector, deployment service, or secret manager.

The pinned local foundation needs no provider, API key, cloud account, or
runtime package dependency beyond Python's standard library.

## Authority ownership

| Authority                                                                                                                                     | System of record  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Goals, workbenches, selected sources, work items, attempts, boundaries, receipts, evidence, governance reviews, human decisions, and outcomes | Palari Company OS |
| Conversations, coding-agent sessions, provider/runtime state, and the interactive execution experience                                        | T3 Code           |
| Branches, commits, diffs, and worktrees                                                                                                       | Git               |
| Pull requests, hosted reviews, and merges                                                                                                     | GitHub            |

The bridge must reference these systems without copying their authority. T3
may display Company OS governance, but it must not infer acceptance from an
agent session, infer a governance record from a ticket, or treat Git/GitHub
state as permission to move Company OS forward.

## Read-only CLI surface selected for v0

The adapter invokes only the pinned repository-local wrapper with argument
arrays:

```text
bin/palari --workspace <configured-workspace> queue --json
bin/palari --workspace <configured-workspace> agent brief <validated-work-id> --as <validated-palari-id> --mode execute --json
```

`queue` is a derived read model. `agent brief` is a read-only preview of the
bounded packet. In contrast, `agent start` writes `.palari/packets` and
`.palari/claims`, and `agent release` removes a claim, so neither is in the v0
allowlist.

The MCP server was considered but not selected for v0. Its advertised tool
surface includes the locally mutating `palari_agent_start` and
`palari_agent_release` tools. A direct two-command allowlist creates a smaller
and easier-to-audit trust boundary.

Git is queried separately to verify the exact Company OS checkout revision:

```text
git -C <configured-checkout> rev-parse HEAD
```

Company OS has no public CLI `--version` command at this pin. Compatibility is
therefore enforced by the exact Git revision, the known package version, the
workspace schema, and the packet schema literal.

## Observed JSON contracts

### `queue --json`

The queue envelope is unversioned:

```text
{
  "workspace": string,
  "queue": QueueItem[]
}
```

Observed `QueueItem` fields at the pin are:

```text
id, title, status, risk, intensity, attention, why,
goal, goal_title, workbench, workbench_label,
palari, palari_name, owner,
ai_safe_to_proceed, waiting_on_human,
evidence_state, review_state, receipt_state, acceptance_state,
approval_progress, authority_state, scope_overlap_state,
integration_state, next_step_type, next_action,
active_attempts, coordination_warnings,
recommended_intensity, intensity_reason, learning_signal,
playbook_recommendations, next_commands,
agent_loop_command, agent_handoff_command,
external_provider, external_key, external_url, external_updated_at
```

The adapter consumes only the explicit normalized subset. Command strings,
external references, and raw attempt structures are excluded from browser
data.

### `agent brief ... --json`

The packet is versioned with:

```text
"schema_version": "palari.agent_packet.v1"
```

Observed top-level fields are:

```text
schema_version, packet_id, mode, status, workspace, created_at,
agent, work_item, goal, workbench, dependencies,
allowed_resources, allowed_paths, allowed_sources,
allowed_capabilities, capability_policy, forbidden_actions,
required_output, completion_contract, proof_state, state,
documentation_state, recommended_docs, omitted_context,
stop_conditions, blockers, next_allowed_commands,
one_sentence_instruction, context_hash
```

The compact panel derives only counts, booleans, safe labels, and the work-item
objective from validated fields. It never forwards the raw packet.

### `validate --json`

Successful validation is unversioned and returns:

```text
{
  "valid": true,
  "workspace": string,
  "counts": { <collection-name>: non-negative integer }
}
```

Invalid workspace failures may be plain stderr even when `--json` is supplied,
so the bridge must map failures to fixed redacted error codes rather than
forward subprocess output.

## Fields that must not cross into the browser

Raw Company OS read models can contain:

- absolute attempt `workspace_path` values;
- relative read/write paths and source URIs;
- branches, commits, heads, changed files, and artifact paths;
- external provider IDs, keys, and URLs;
- generated command strings;
- raw attempt, receipt, evidence, and decision records;
- subprocess stdout, stderr, argv, environment, and local checkout paths.

The T3 response is constructed field by field and contains only bounded labels,
governance states, counts, booleans, a safe objective, and a verified public
Company OS revision.

## Capabilities intentionally deferred

The first slice does not implement:

- Company OS mutations of any kind;
- claim, start, finish, accept, merge, push, deploy, or external-write actions;
- APP-ticket import or an assertion that existing tickets are Company OS data;
- GitHub synchronization;
- live Palari, beta, customer, or provider access;
- multi-workspace selection in the browser;
- browser-supplied workspace paths, work IDs, Palari IDs, or CLI operations;
- raw detail, history, receipt, evidence, review, or decision payloads;
- an agent runtime or connector execution service.

Any later write path requires a separate versioned protocol, explicit human
authority, and independent security review.
