import * as Schema from "effect/Schema";

import { IsoDateTime, NonNegativeInt } from "./baseSchemas.ts";

export const PALARI_BRIDGE_PROTOCOL_VERSION = 1 as const;

const PalariShortText = Schema.String.check(Schema.isMaxLength(256));
const PalariLongText = Schema.String.check(Schema.isMaxLength(512));

export const PalariReadOverviewInput = Schema.Struct({
  protocolVersion: Schema.Int,
});
export type PalariReadOverviewInput = typeof PalariReadOverviewInput.Type;

export const PalariOperationalState = Schema.Literals([
  "disabled",
  "unavailable",
  "incompatible",
  "invalid",
]);
export type PalariOperationalState = typeof PalariOperationalState.Type;

export const PalariStatusCode = Schema.Literals([
  "disabled",
  "checkout_missing",
  "cli_missing",
  "workspace_missing",
  "process_failed",
  "timed_out",
  "cancelled",
  "output_too_large",
  "bridge_protocol_unsupported",
  "checkout_revision_mismatch",
  "queue_schema_mismatch",
  "packet_schema_mismatch",
  "workspace_schema_unsupported",
  "workspace_outside_root",
  "workspace_symlink_escape",
  "workspace_invalid",
  "malformed_json",
]);
export type PalariStatusCode = typeof PalariStatusCode.Type;

export const PalariOperationalStatus = Schema.Struct({
  protocolVersion: Schema.Literal(PALARI_BRIDGE_PROTOCOL_VERSION),
  status: PalariOperationalState,
  checkedAt: IsoDateTime,
  code: PalariStatusCode,
  message: PalariLongText,
  retryable: Schema.Boolean,
});
export type PalariOperationalStatus = typeof PalariOperationalStatus.Type;

export const PalariAssignedPalari = Schema.Struct({
  id: PalariShortText,
  name: PalariShortText,
});
export type PalariAssignedPalari = typeof PalariAssignedPalari.Type;

export const PalariWorkItemReadiness = Schema.Struct({
  evidence: PalariShortText,
  review: PalariShortText,
  receipt: PalariShortText,
  acceptance: PalariShortText,
  approval: PalariShortText,
  boundary: PalariShortText,
});
export type PalariWorkItemReadiness = typeof PalariWorkItemReadiness.Type;

export const PalariWorkItemOverview = Schema.Struct({
  id: PalariShortText,
  title: PalariShortText,
  status: PalariShortText,
  attention: PalariShortText,
  why: PalariLongText,
  goalTitle: PalariShortText,
  workbenchLabel: PalariShortText,
  owner: PalariShortText,
  assignedPalari: PalariAssignedPalari,
  risk: PalariShortText,
  intensity: PalariShortText,
  nextStepType: PalariShortText,
  aiSafeToProceed: Schema.Boolean,
  waitingOnHuman: Schema.Boolean,
  readiness: PalariWorkItemReadiness,
  contentTruncated: Schema.Boolean,
});
export type PalariWorkItemOverview = typeof PalariWorkItemOverview.Type;

export const PalariOverviewSummary = Schema.Struct({
  total: NonNegativeInt,
  needsAttention: NonNegativeInt,
  waitingOnHuman: NonNegativeInt,
  active: NonNegativeInt,
  reviewReady: NonNegativeInt,
  evidenceReady: NonNegativeInt,
});
export type PalariOverviewSummary = typeof PalariOverviewSummary.Type;

export const PalariScopeSummary = Schema.Struct({
  workItemId: PalariShortText,
  objective: PalariLongText,
  readPathCount: NonNegativeInt,
  writePathCount: NonNegativeInt,
  sourceCount: NonNegativeInt,
  forbiddenActionCount: NonNegativeInt,
  requiredOutputCount: NonNegativeInt,
  requiresEvidence: Schema.Boolean,
  requiresReview: Schema.Boolean,
  requiresReceipt: Schema.Boolean,
  requiresHumanDecision: Schema.Boolean,
  externalWritesAllowed: Schema.Boolean,
  contentTruncated: Schema.Boolean,
});
export type PalariScopeSummary = typeof PalariScopeSummary.Type;

export const PalariReadyOverview = Schema.Struct({
  protocolVersion: Schema.Literal(PALARI_BRIDGE_PROTOCOL_VERSION),
  status: Schema.Literal("ready"),
  checkedAt: IsoDateTime,
  companyOs: Schema.Struct({
    version: PalariShortText,
    revision: Schema.String.check(Schema.isPattern(/^[0-9a-f]{40}$/)),
  }),
  workspace: Schema.Struct({
    id: PalariShortText,
    name: PalariShortText,
    schemaVersion: Schema.Literal(1),
  }),
  summary: PalariOverviewSummary,
  workItems: Schema.Array(PalariWorkItemOverview).check(Schema.isMaxLength(50)),
  scopeSummary: Schema.NullOr(PalariScopeSummary),
  itemsTruncated: Schema.Boolean,
  contentTruncated: Schema.Boolean,
});
export type PalariReadyOverview = typeof PalariReadyOverview.Type;

export const PalariReadOverviewResult = Schema.Union([
  PalariReadyOverview,
  PalariOperationalStatus,
]);
export type PalariReadOverviewResult = typeof PalariReadOverviewResult.Type;
