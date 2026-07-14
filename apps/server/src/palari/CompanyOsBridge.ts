import * as Context from "effect/Context";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Result from "effect/Result";
import * as Schema from "effect/Schema";

import {
  PALARI_BRIDGE_PROTOCOL_VERSION,
  PalariReadyOverview as PalariReadyOverviewSchema,
  type PalariOperationalStatus,
  type PalariReadOverviewInput,
  type PalariReadOverviewResult,
  type PalariReadyOverview,
  type PalariScopeSummary,
  type PalariWorkItemOverview,
} from "@t3tools/contracts";
import { isRelativePathWithinRoot } from "@t3tools/shared/path";

import * as ProcessRunner from "../processRunner.ts";

export const PINNED_COMPANY_OS_REVISION = "e651a3e9c9cacfc584d507a75cf3152df860d9d4";
export const PINNED_COMPANY_OS_VERSION = "0.1.2";
export const PINNED_AGENT_PACKET_SCHEMA = "palari.agent_packet.v1";

const MAX_PROCESS_STREAM_BYTES = 512 * 1024;
const MAX_COMBINED_CLI_OUTPUT_BYTES = 1024 * 1024;
const MAX_BROWSER_PAYLOAD_BYTES = 256 * 1024;
const MAX_WORK_ITEMS = 50;
const SHORT_TEXT_LENGTH = 256;
const LONG_TEXT_LENGTH = 512;

const WORKSPACE_COLLECTION_KEYS = [
  "goals",
  "humans",
  "palaris",
  "sources",
  "work_items",
  "attempts",
  "evidence_runs",
  "review_verdicts",
  "human_decisions",
  "receipts",
  "decisions",
  "outcomes",
  "playbook_sources",
  "workbenches",
  "capabilities",
  "authority_profiles",
  "integrations",
  "integration_plans",
  "integration_outbox",
  "proposals",
  "acceptance_records",
] as const;
const WORKSPACE_COLLECTION_KEY_SET = new Set<string>(WORKSPACE_COLLECTION_KEYS);

export interface CompanyOsBridgeConfig {
  readonly enabled: boolean;
  readonly checkout?: string | undefined;
  readonly workspaceRoot?: string | undefined;
  readonly workspace?: string | undefined;
  readonly workspaceId?: string | undefined;
}

export const resolveCompanyOsBridgeConfig = (
  env: NodeJS.ProcessEnv = process.env,
): CompanyOsBridgeConfig => ({
  enabled: /^(1|true|yes)$/i.test(env.T3CODE_PALARI_ENABLED?.trim() ?? ""),
  checkout: nonEmpty(env.T3CODE_PALARI_COMPANY_OS_CHECKOUT),
  workspaceRoot: nonEmpty(env.T3CODE_PALARI_WORKSPACE_ROOT),
  workspace: nonEmpty(env.T3CODE_PALARI_WORKSPACE),
  workspaceId: nonEmpty(env.T3CODE_PALARI_WORKSPACE_ID),
});

export const isCompanyOsBridgeConfigured = (env: NodeJS.ProcessEnv = process.env): boolean =>
  resolveCompanyOsBridgeConfig(env).enabled;

export interface CompanyOsBridgeService {
  readonly readOverview: (
    input: PalariReadOverviewInput,
  ) => Effect.Effect<PalariReadOverviewResult>;
}

export class CompanyOsBridge extends Context.Reference<CompanyOsBridgeService>(
  "t3/palari/CompanyOsBridge",
  {
    defaultValue: () => ({
      readOverview: (input) =>
        Effect.map(DateTime.now, (now) => {
          const checkedAt = DateTime.formatIso(now);
          return input.protocolVersion === PALARI_BRIDGE_PROTOCOL_VERSION
            ? status(checkedAt, {
                status: "disabled",
                code: "disabled",
                message: "Palari Company OS read-only integration is disabled.",
                retryable: false,
              })
            : status(checkedAt, {
                status: "incompatible",
                code: "bridge_protocol_unsupported",
                message: "This client uses an unsupported Palari bridge protocol version.",
                retryable: false,
              });
        }),
    }),
  },
) {}

export const PALARI_READ_OPERATIONS = ["queue", "agent-brief"] as const;
export type PalariReadOperation = (typeof PALARI_READ_OPERATIONS)[number];

export function buildPalariReadArgs(
  operation: string,
  input: {
    readonly workspace: string;
    readonly workItemId?: string;
    readonly palariId?: string;
  },
): ReadonlyArray<string> | undefined {
  switch (operation) {
    case "queue":
      return ["--workspace", input.workspace, "queue", "--json"];
    case "agent-brief":
      return input.workItemId && input.palariId
        ? [
            "--workspace",
            input.workspace,
            "agent",
            "brief",
            input.workItemId,
            "--as",
            input.palariId,
            "--mode",
            "execute",
            "--json",
          ]
        : undefined;
    default:
      return undefined;
  }
}

const RawIdentifier = Schema.String.check(
  Schema.isMaxLength(SHORT_TEXT_LENGTH),
  Schema.isPattern(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
);

const WorkStatus = Schema.Literals([
  "proposed",
  "active",
  "in-review",
  "needs-human",
  "blocked",
  "completed",
  "closed",
  "done",
]);
const AttentionState = Schema.Literals([
  "needs-human-decision",
  "changes-requested",
  "needs-review",
  "needs-evidence",
  "ready-to-integrate",
  "receipt-ready",
  "ready-for-ai-work",
  "blocked",
  "closed",
]);
const Risk = Schema.Literals(["R1", "R2", "R3", "R4", "R5"]);
const Intensity = Schema.Literals(["light", "standard", "high"]);
const NextStepType = Schema.Literals([
  "check-active-proof",
  "start-work",
  "human-decision",
  "review-handoff",
  "repair",
  "closed",
  "inspect",
]);
const EvidenceState = Schema.Literals([
  "not-started",
  "missing",
  "stale",
  "passed",
  "failed",
  "skipped",
]);
const ReviewState = Schema.Literals([
  "waiting-on-evidence",
  "missing",
  "stale",
  "accept-ready",
  "changes-requested",
  "needs-human-decision",
  "blocked",
]);
const ReceiptState = Schema.Literals(["not-started", "missing", "stale", "ready"]);
const AcceptanceState = Schema.Literals([
  "pending",
  "receipt-path",
  "ready-to-record",
  "accepted",
  "rejected",
  "revoked",
]);
const ScopeOverlapState = Schema.Literals(["clear", "blocked"]);
const ApprovalProgress = Schema.String.check(
  Schema.isMaxLength(64),
  Schema.isPattern(/^(0|[1-9]\d*)\/(0|[1-9]\d*)$/),
);

const RawQueueItem = Schema.Struct({
  id: RawIdentifier,
  title: Schema.String,
  status: WorkStatus,
  attention: AttentionState,
  why: Schema.String,
  goal_title: Schema.String,
  workbench_label: Schema.String,
  owner: Schema.String,
  palari: Schema.Union([Schema.Literal(""), RawIdentifier]),
  palari_name: Schema.String,
  risk: Risk,
  intensity: Intensity,
  next_step_type: NextStepType,
  ai_safe_to_proceed: Schema.Boolean,
  waiting_on_human: Schema.Boolean,
  evidence_state: EvidenceState,
  review_state: ReviewState,
  receipt_state: ReceiptState,
  acceptance_state: AcceptanceState,
  approval_progress: ApprovalProgress,
  scope_overlap_state: ScopeOverlapState,
});
type RawQueueItem = typeof RawQueueItem.Type;

const RawQueueEnvelope = Schema.Struct({
  workspace: Schema.String,
  queue: Schema.Array(RawQueueItem),
});
type RawQueueEnvelope = typeof RawQueueEnvelope.Type;

const RawAgentBrief = Schema.Struct({
  schema_version: Schema.Literal(PINNED_AGENT_PACKET_SCHEMA),
  workspace: Schema.String,
  agent: Schema.Struct({
    id: RawIdentifier,
  }),
  work_item: Schema.Struct({
    id: RawIdentifier,
    objective: Schema.String,
  }),
  allowed_paths: Schema.Struct({
    read: Schema.Array(Schema.String),
    write: Schema.Array(Schema.String),
  }),
  allowed_sources: Schema.Array(Schema.Unknown),
  forbidden_actions: Schema.Array(Schema.String),
  required_output: Schema.Struct({
    output_targets: Schema.Array(Schema.String),
  }),
  completion_contract: Schema.Struct({
    external_writes_allowed: Schema.Boolean,
    requires_evidence: Schema.Boolean,
    requires_human_decision: Schema.Boolean,
    requires_receipt: Schema.Boolean,
    requires_review: Schema.Boolean,
  }),
});
type RawAgentBrief = typeof RawAgentBrief.Type;

const RawWorkspaceHeader = Schema.Struct({
  schema_version: Schema.Literal(1),
  name: Schema.String,
  collection_files: Schema.optionalKey(
    Schema.Struct({
      goals: Schema.optionalKey(Schema.Array(Schema.String)),
      humans: Schema.optionalKey(Schema.Array(Schema.String)),
      palaris: Schema.optionalKey(Schema.Array(Schema.String)),
      sources: Schema.optionalKey(Schema.Array(Schema.String)),
      work_items: Schema.optionalKey(Schema.Array(Schema.String)),
      attempts: Schema.optionalKey(Schema.Array(Schema.String)),
      evidence_runs: Schema.optionalKey(Schema.Array(Schema.String)),
      review_verdicts: Schema.optionalKey(Schema.Array(Schema.String)),
      human_decisions: Schema.optionalKey(Schema.Array(Schema.String)),
      receipts: Schema.optionalKey(Schema.Array(Schema.String)),
      decisions: Schema.optionalKey(Schema.Array(Schema.String)),
      outcomes: Schema.optionalKey(Schema.Array(Schema.String)),
      playbook_sources: Schema.optionalKey(Schema.Array(Schema.String)),
      workbenches: Schema.optionalKey(Schema.Array(Schema.String)),
      capabilities: Schema.optionalKey(Schema.Array(Schema.String)),
      authority_profiles: Schema.optionalKey(Schema.Array(Schema.String)),
      integrations: Schema.optionalKey(Schema.Array(Schema.String)),
      integration_plans: Schema.optionalKey(Schema.Array(Schema.String)),
      integration_outbox: Schema.optionalKey(Schema.Array(Schema.String)),
      proposals: Schema.optionalKey(Schema.Array(Schema.String)),
      acceptance_records: Schema.optionalKey(Schema.Array(Schema.String)),
    }),
  ),
});
type RawWorkspaceHeader = typeof RawWorkspaceHeader.Type;

const isRawQueueEnvelope = Schema.is(RawQueueEnvelope);
const isRawAgentBrief = Schema.is(RawAgentBrief);
const isRawWorkspaceHeader = Schema.is(RawWorkspaceHeader);
const encodeReadyOverviewJson = Schema.encodeEffect(
  Schema.fromJsonString(PalariReadyOverviewSchema),
);

type BridgeStatusInput = Omit<PalariOperationalStatus, "protocolVersion" | "checkedAt">;

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isValidConfiguredWorkspaceId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
}

function hasOnlyKnownCollectionFileKeys(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return true;
  const collectionFiles = Reflect.get(value, "collection_files");
  if (collectionFiles === undefined) return true;
  if (
    typeof collectionFiles !== "object" ||
    collectionFiles === null ||
    Array.isArray(collectionFiles)
  ) {
    return false;
  }
  return Object.keys(collectionFiles).every((key) => WORKSPACE_COLLECTION_KEY_SET.has(key));
}

function isSafeWorkspaceRelativeFile(value: string): boolean {
  if (value.length === 0 || value.includes("\0")) return false;
  if (/^(?:[A-Za-z]:[\\/]|\\\\)/.test(value)) return false;
  return !value.replaceAll("\\", "/").split("/").includes("..");
}

function status(checkedAt: string, input: BridgeStatusInput): PalariOperationalStatus {
  return {
    protocolVersion: PALARI_BRIDGE_PROTOCOL_VERSION,
    checkedAt,
    ...input,
  };
}

function parseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function clip(
  value: string,
  maxLength: number,
): { readonly value: string; readonly clipped: boolean } {
  if (value.length <= maxLength) return { value, clipped: false };
  return { value: value.slice(0, maxLength), clipped: true };
}

function normalizeWorkItem(item: RawQueueItem): PalariWorkItemOverview {
  const fields = {
    id: clip(item.id, SHORT_TEXT_LENGTH),
    title: clip(item.title, SHORT_TEXT_LENGTH),
    status: clip(item.status, SHORT_TEXT_LENGTH),
    attention: clip(item.attention, SHORT_TEXT_LENGTH),
    why: clip(item.why, LONG_TEXT_LENGTH),
    goalTitle: clip(item.goal_title, SHORT_TEXT_LENGTH),
    workbenchLabel: clip(item.workbench_label, SHORT_TEXT_LENGTH),
    owner: clip(item.owner, SHORT_TEXT_LENGTH),
    palariId: clip(item.palari, SHORT_TEXT_LENGTH),
    palariName: clip(item.palari_name, SHORT_TEXT_LENGTH),
    risk: clip(item.risk, SHORT_TEXT_LENGTH),
    intensity: clip(item.intensity, SHORT_TEXT_LENGTH),
    nextStepType: clip(item.next_step_type, SHORT_TEXT_LENGTH),
    evidence: clip(item.evidence_state, SHORT_TEXT_LENGTH),
    review: clip(item.review_state, SHORT_TEXT_LENGTH),
    receipt: clip(item.receipt_state, SHORT_TEXT_LENGTH),
    acceptance: clip(item.acceptance_state, SHORT_TEXT_LENGTH),
    approval: clip(item.approval_progress, SHORT_TEXT_LENGTH),
    boundary: clip(item.scope_overlap_state, SHORT_TEXT_LENGTH),
  };

  return {
    id: fields.id.value,
    title: fields.title.value,
    status: fields.status.value,
    attention: fields.attention.value,
    why: fields.why.value,
    goalTitle: fields.goalTitle.value,
    workbenchLabel: fields.workbenchLabel.value,
    owner: fields.owner.value,
    assignedPalari: { id: fields.palariId.value, name: fields.palariName.value },
    risk: fields.risk.value,
    intensity: fields.intensity.value,
    nextStepType: fields.nextStepType.value,
    aiSafeToProceed: item.ai_safe_to_proceed,
    waitingOnHuman: item.waiting_on_human,
    readiness: {
      evidence: fields.evidence.value,
      review: fields.review.value,
      receipt: fields.receipt.value,
      acceptance: fields.acceptance.value,
      approval: fields.approval.value,
      boundary: fields.boundary.value,
    },
    contentTruncated: Object.values(fields).some((field) => field.clipped),
  };
}

function normalizeScope(brief: RawAgentBrief): PalariScopeSummary {
  const workItemId = clip(brief.work_item.id, SHORT_TEXT_LENGTH);
  const objective = clip(brief.work_item.objective, LONG_TEXT_LENGTH);
  return {
    workItemId: workItemId.value,
    objective: objective.value,
    readPathCount: brief.allowed_paths.read.length,
    writePathCount: brief.allowed_paths.write.length,
    sourceCount: brief.allowed_sources.length,
    forbiddenActionCount: brief.forbidden_actions.length,
    requiredOutputCount: brief.required_output.output_targets.length,
    requiresEvidence: brief.completion_contract.requires_evidence,
    requiresReview: brief.completion_contract.requires_review,
    requiresReceipt: brief.completion_contract.requires_receipt,
    requiresHumanDecision: brief.completion_contract.requires_human_decision,
    externalWritesAllowed: brief.completion_contract.external_writes_allowed,
    contentTruncated: workItemId.clipped || objective.clipped,
  };
}

function minimalProcessEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    PYTHONNOUSERSITE: "1",
  };
  for (const key of ["PATH", "PATHEXT", "SystemRoot", "WINDIR"] as const) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return env;
}

function processFailureStatus(
  checkedAt: string,
  error: ProcessRunner.ProcessRunError,
): PalariOperationalStatus {
  if (error._tag === "ProcessTimeoutError") {
    return status(checkedAt, {
      status: "unavailable",
      code: "timed_out",
      message: "Palari Company OS did not respond within the read-only time limit.",
      retryable: true,
    });
  }
  if (error._tag === "ProcessOutputLimitError") {
    return status(checkedAt, {
      status: "unavailable",
      code: "output_too_large",
      message: "Palari Company OS returned more data than the read-only bridge permits.",
      retryable: false,
    });
  }
  return status(checkedAt, {
    status: "unavailable",
    code: "process_failed",
    message: "The Palari Company OS read-only command could not be completed.",
    retryable: true,
  });
}

export const make = Effect.fn("CompanyOsBridge.make")(function* (config: CompanyOsBridgeConfig) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const processRunner = yield* ProcessRunner.ProcessRunner;

  const validateWorkspaceFile = Effect.fn("CompanyOsBridge.validateWorkspaceFile")(function* (
    canonicalWorkspace: string,
    candidate: string,
  ) {
    const resolvedCandidate = path.resolve(candidate);
    if (
      !isRelativePathWithinRoot(
        path.relative(canonicalWorkspace, resolvedCandidate),
        path.isAbsolute,
      )
    ) {
      return "invalid" as const;
    }
    const canonicalCandidate = yield* fileSystem.realPath(resolvedCandidate).pipe(Effect.option);
    if (canonicalCandidate._tag === "None") return "invalid" as const;
    if (
      !isRelativePathWithinRoot(
        path.relative(canonicalWorkspace, canonicalCandidate.value),
        path.isAbsolute,
      )
    ) {
      return "symlink-escape" as const;
    }
    const info = yield* fileSystem.stat(canonicalCandidate.value).pipe(Effect.option);
    if (info._tag === "None" || info.value.type !== "File") return "invalid" as const;
    return { path: canonicalCandidate.value } as const;
  });

  const readOverview: CompanyOsBridgeService["readOverview"] = Effect.fn(
    "CompanyOsBridge.readOverview",
  )(function* (input) {
    const checkedAt = DateTime.formatIso(yield* DateTime.now);
    if (input.protocolVersion !== PALARI_BRIDGE_PROTOCOL_VERSION) {
      return status(checkedAt, {
        status: "incompatible",
        code: "bridge_protocol_unsupported",
        message: "This client uses an unsupported Palari bridge protocol version.",
        retryable: false,
      });
    }
    if (!config.enabled) {
      return status(checkedAt, {
        status: "disabled",
        code: "disabled",
        message: "Palari Company OS read-only integration is disabled.",
        retryable: false,
      });
    }

    const checkout = config.checkout;
    if (
      !checkout ||
      !(yield* fileSystem.exists(checkout).pipe(Effect.orElseSucceed(() => false)))
    ) {
      return status(checkedAt, {
        status: "unavailable",
        code: "checkout_missing",
        message: "The configured Palari Company OS checkout is unavailable.",
        retryable: false,
      });
    }
    const cli = path.join(checkout, "bin", "palari");
    if (!(yield* fileSystem.exists(cli).pipe(Effect.orElseSucceed(() => false)))) {
      return status(checkedAt, {
        status: "unavailable",
        code: "cli_missing",
        message: "The pinned Palari Company OS command is unavailable.",
        retryable: false,
      });
    }

    const workspaceRoot = config.workspaceRoot;
    const workspace = config.workspace;
    const workspaceId = config.workspaceId;
    if (!workspaceRoot || !workspace || !workspaceId) {
      return status(checkedAt, {
        status: "unavailable",
        code: "workspace_missing",
        message: "The Palari read-only workspace is not fully configured.",
        retryable: false,
      });
    }
    if (!isValidConfiguredWorkspaceId(workspaceId)) {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_invalid",
        message: "The configured Palari workspace identity is invalid.",
        retryable: false,
      });
    }
    if (
      !(yield* fileSystem.exists(workspaceRoot).pipe(Effect.orElseSucceed(() => false))) ||
      !(yield* fileSystem.exists(workspace).pipe(Effect.orElseSucceed(() => false)))
    ) {
      return status(checkedAt, {
        status: "unavailable",
        code: "workspace_missing",
        message: "The configured Palari read-only workspace is unavailable.",
        retryable: false,
      });
    }

    const resolvedRoot = path.resolve(workspaceRoot);
    const resolvedWorkspace = path.resolve(workspace);
    if (
      !isRelativePathWithinRoot(path.relative(resolvedRoot, resolvedWorkspace), path.isAbsolute)
    ) {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_outside_root",
        message: "The configured Palari workspace is outside its approved root.",
        retryable: false,
      });
    }

    const canonical = yield* Effect.all({
      root: fileSystem.realPath(resolvedRoot),
      workspace: fileSystem.realPath(resolvedWorkspace),
    }).pipe(Effect.option);
    if (canonical._tag === "None") {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_invalid",
        message: "The configured Palari workspace could not be validated.",
        retryable: false,
      });
    }
    if (
      !isRelativePathWithinRoot(
        path.relative(canonical.value.root, canonical.value.workspace),
        path.isAbsolute,
      )
    ) {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_symlink_escape",
        message: "The configured Palari workspace resolves outside its approved root.",
        retryable: false,
      });
    }

    const safeEnv = minimalProcessEnvironment();
    const gitResult = yield* Effect.result(
      processRunner.run({
        command: "git",
        args: ["-C", checkout, "rev-parse", "HEAD"],
        timeout: "2 seconds",
        maxOutputBytes: 1024,
        outputMode: "error",
        env: safeEnv,
        extendEnv: false,
      }),
    );
    if (Result.isFailure(gitResult)) return processFailureStatus(checkedAt, gitResult.failure);
    const revision = gitResult.success.stdout.trim();
    if (gitResult.success.code !== 0 || !/^[0-9a-f]{40}$/.test(revision)) {
      return status(checkedAt, {
        status: "unavailable",
        code: "process_failed",
        message: "The Palari Company OS checkout revision could not be verified.",
        retryable: true,
      });
    }
    if (revision !== PINNED_COMPANY_OS_REVISION) {
      return status(checkedAt, {
        status: "incompatible",
        code: "checkout_revision_mismatch",
        message: "The Palari Company OS checkout does not match the pinned compatible revision.",
        retryable: false,
      });
    }

    const validatedWorkspaceJson = yield* validateWorkspaceFile(
      canonical.value.workspace,
      path.join(canonical.value.workspace, "workspace.json"),
    );
    if (validatedWorkspaceJson === "symlink-escape") {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_symlink_escape",
        message: "A Palari workspace file resolves outside its approved root.",
        retryable: false,
      });
    }
    if (validatedWorkspaceJson === "invalid") {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_invalid",
        message: "The configured Palari workspace file is invalid.",
        retryable: false,
      });
    }
    const rawWorkspaceText = yield* fileSystem
      .readFileString(validatedWorkspaceJson.path)
      .pipe(Effect.option);
    if (rawWorkspaceText._tag === "None") {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_invalid",
        message: "The configured Palari workspace is not readable.",
        retryable: false,
      });
    }
    const rawWorkspaceJson = parseJson(rawWorkspaceText.value);
    if (rawWorkspaceJson === undefined) {
      return status(checkedAt, {
        status: "invalid",
        code: "malformed_json",
        message: "The configured Palari workspace contains malformed JSON.",
        retryable: false,
      });
    }
    if (
      !hasOnlyKnownCollectionFileKeys(rawWorkspaceJson) ||
      !isRawWorkspaceHeader(rawWorkspaceJson)
    ) {
      return status(checkedAt, {
        status: "incompatible",
        code: "workspace_schema_unsupported",
        message: "The Palari workspace schema is not supported by this bridge.",
        retryable: false,
      });
    }
    const workspaceHeader = rawWorkspaceJson as RawWorkspaceHeader;
    for (const collectionFiles of Object.values(workspaceHeader.collection_files ?? {})) {
      if (collectionFiles === undefined) continue;
      for (const relativeFile of collectionFiles) {
        if (!isSafeWorkspaceRelativeFile(relativeFile) || path.isAbsolute(relativeFile)) {
          return status(checkedAt, {
            status: "invalid",
            code: "workspace_invalid",
            message: "A declared Palari workspace file is invalid.",
            retryable: false,
          });
        }
        const validatedCollectionFile = yield* validateWorkspaceFile(
          canonical.value.workspace,
          path.join(canonical.value.workspace, relativeFile),
        );
        if (validatedCollectionFile === "symlink-escape") {
          return status(checkedAt, {
            status: "invalid",
            code: "workspace_symlink_escape",
            message: "A Palari workspace file resolves outside its approved root.",
            retryable: false,
          });
        }
        if (validatedCollectionFile === "invalid") {
          return status(checkedAt, {
            status: "invalid",
            code: "workspace_invalid",
            message: "A declared Palari workspace file is invalid.",
            retryable: false,
          });
        }
      }
    }

    const queueArgs = buildPalariReadArgs("queue", { workspace: canonical.value.workspace });
    if (!queueArgs) {
      return status(checkedAt, {
        status: "unavailable",
        code: "process_failed",
        message: "The requested Palari read operation is not allowed.",
        retryable: false,
      });
    }
    const queueResult = yield* Effect.result(
      processRunner.run({
        command: cli,
        args: queueArgs,
        timeout: "5 seconds",
        maxOutputBytes: MAX_PROCESS_STREAM_BYTES,
        outputMode: "error",
        env: safeEnv,
        extendEnv: false,
      }),
    );
    if (Result.isFailure(queueResult)) return processFailureStatus(checkedAt, queueResult.failure);
    if (queueResult.success.code !== 0) {
      return status(checkedAt, {
        status: "invalid",
        code: "workspace_invalid",
        message: "The configured Palari workspace did not pass the read-only query.",
        retryable: false,
      });
    }
    if (
      Buffer.byteLength(queueResult.success.stdout) +
        Buffer.byteLength(queueResult.success.stderr) >
      MAX_COMBINED_CLI_OUTPUT_BYTES
    ) {
      return status(checkedAt, {
        status: "unavailable",
        code: "output_too_large",
        message: "Palari Company OS returned more data than the read-only bridge permits.",
        retryable: false,
      });
    }
    const queueJson = parseJson(queueResult.success.stdout);
    if (queueJson === undefined) {
      return status(checkedAt, {
        status: "invalid",
        code: "malformed_json",
        message: "Palari Company OS returned malformed JSON.",
        retryable: false,
      });
    }
    if (!isRawQueueEnvelope(queueJson)) {
      return status(checkedAt, {
        status: "incompatible",
        code: "queue_schema_mismatch",
        message: "The Palari Company OS queue schema is incompatible with this bridge.",
        retryable: false,
      });
    }
    const queue = queueJson as RawQueueEnvelope;
    if (queue.workspace !== workspaceHeader.name) {
      return status(checkedAt, {
        status: "incompatible",
        code: "queue_schema_mismatch",
        message: "The Palari Company OS queue identity is incompatible with this workspace.",
        retryable: false,
      });
    }

    let scopeSummary: PalariScopeSummary | null = null;
    const topItem = queue.queue[0];
    if (topItem && topItem.id.trim() !== "" && topItem.palari.trim() !== "") {
      const briefArgs = buildPalariReadArgs("agent-brief", {
        workspace: canonical.value.workspace,
        workItemId: topItem.id,
        palariId: topItem.palari,
      });
      if (!briefArgs) {
        return status(checkedAt, {
          status: "unavailable",
          code: "process_failed",
          message: "The requested Palari read operation is not allowed.",
          retryable: false,
        });
      }
      const briefResult = yield* Effect.result(
        processRunner.run({
          command: cli,
          args: briefArgs,
          timeout: "5 seconds",
          maxOutputBytes: MAX_PROCESS_STREAM_BYTES,
          outputMode: "error",
          env: safeEnv,
          extendEnv: false,
        }),
      );
      if (Result.isFailure(briefResult)) {
        return processFailureStatus(checkedAt, briefResult.failure);
      }
      if (briefResult.success.code !== 0) {
        return status(checkedAt, {
          status: "invalid",
          code: "workspace_invalid",
          message: "The Palari scope summary could not be read from this workspace.",
          retryable: false,
        });
      }
      if (
        Buffer.byteLength(briefResult.success.stdout) +
          Buffer.byteLength(briefResult.success.stderr) >
        MAX_COMBINED_CLI_OUTPUT_BYTES
      ) {
        return status(checkedAt, {
          status: "unavailable",
          code: "output_too_large",
          message: "Palari Company OS returned more data than the read-only bridge permits.",
          retryable: false,
        });
      }
      const briefJson = parseJson(briefResult.success.stdout);
      if (briefJson === undefined) {
        return status(checkedAt, {
          status: "invalid",
          code: "malformed_json",
          message: "Palari Company OS returned malformed JSON.",
          retryable: false,
        });
      }
      if (!isRawAgentBrief(briefJson)) {
        return status(checkedAt, {
          status: "incompatible",
          code: "packet_schema_mismatch",
          message: "The Palari Company OS agent packet schema is incompatible with this bridge.",
          retryable: false,
        });
      }
      const brief = briefJson as RawAgentBrief;
      if (
        brief.workspace !== workspaceHeader.name ||
        brief.work_item.id !== topItem.id ||
        brief.agent.id !== topItem.palari
      ) {
        return status(checkedAt, {
          status: "incompatible",
          code: "packet_schema_mismatch",
          message: "The Palari Company OS agent packet identity is incompatible with this query.",
          retryable: false,
        });
      }
      scopeSummary = normalizeScope(brief);
    }

    const clippedWorkspaceName = clip(workspaceHeader.name, SHORT_TEXT_LENGTH);
    const selectedItems = queue.queue.slice(0, MAX_WORK_ITEMS).map(normalizeWorkItem);
    const ready: PalariReadyOverview = {
      protocolVersion: PALARI_BRIDGE_PROTOCOL_VERSION,
      status: "ready",
      checkedAt,
      companyOs: {
        version: PINNED_COMPANY_OS_VERSION,
        revision,
      },
      workspace: {
        id: workspaceId,
        name: clippedWorkspaceName.value,
        schemaVersion: 1,
      },
      summary: {
        total: queue.queue.length,
        needsAttention: queue.queue.filter((item) => item.attention !== "ready-for-ai-work").length,
        waitingOnHuman: queue.queue.filter((item) => item.waiting_on_human).length,
        active: queue.queue.filter((item) => item.status === "active").length,
        reviewReady: queue.queue.filter((item) => item.review_state === "accept-ready").length,
        evidenceReady: queue.queue.filter((item) => item.evidence_state === "passed").length,
      },
      workItems: selectedItems,
      scopeSummary,
      itemsTruncated: queue.queue.length > MAX_WORK_ITEMS,
      contentTruncated:
        clippedWorkspaceName.clipped ||
        selectedItems.some((item) => item.contentTruncated) ||
        scopeSummary?.contentTruncated === true,
    };

    const encodedReady = yield* encodeReadyOverviewJson(ready).pipe(Effect.orDie);
    if (Buffer.byteLength(encodedReady) > MAX_BROWSER_PAYLOAD_BYTES) {
      return status(checkedAt, {
        status: "unavailable",
        code: "output_too_large",
        message: "The normalized Palari overview exceeds the browser payload limit.",
        retryable: false,
      });
    }
    return ready;
  });

  return { readOverview } satisfies CompanyOsBridgeService;
});

export const layerConfig = (config: CompanyOsBridgeConfig) =>
  Layer.effect(CompanyOsBridge, make(config));

export const layer = layerConfig(resolveCompanyOsBridgeConfig());
