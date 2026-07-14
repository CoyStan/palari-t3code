import type { PalariReadyOverview, PalariWorkItemOverview } from "@t3tools/contracts";

const ATTENTION_PRIORITY = new Map<string, number>([
  ["needs-human-decision", 0],
  ["changes-requested", 1],
  ["blocked", 2],
  ["needs-review", 3],
  ["needs-evidence", 4],
  ["receipt-ready", 5],
  ["ready-to-integrate", 6],
  ["ready-for-ai-work", 7],
]);

function attentionPriority(item: PalariWorkItemOverview): number {
  if (item.waitingOnHuman) return -1;
  return ATTENTION_PRIORITY.get(item.attention) ?? 100;
}

export function orderPalariWorkItems(
  items: PalariReadyOverview["workItems"],
): ReadonlyArray<PalariWorkItemOverview> {
  return [...items].sort((left, right) => {
    const priorityDelta = attentionPriority(left) - attentionPriority(right);
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title);
  });
}

export function formatPalariLabel(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type PalariBadgeTone =
  | "default"
  | "destructive"
  | "error"
  | "info"
  | "outline"
  | "secondary"
  | "success"
  | "warning";

const ATTENTION_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  "needs-human-decision": "warning",
  "changes-requested": "error",
  "needs-review": "info",
  "needs-evidence": "info",
  "ready-to-integrate": "success",
  "receipt-ready": "success",
  "ready-for-ai-work": "success",
  blocked: "error",
  closed: "secondary",
};

const EVIDENCE_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  "not-started": "warning",
  missing: "warning",
  stale: "warning",
  passed: "success",
  failed: "error",
  skipped: "secondary",
};

const REVIEW_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  "waiting-on-evidence": "info",
  missing: "warning",
  stale: "warning",
  "accept-ready": "success",
  "changes-requested": "error",
  "needs-human-decision": "warning",
  blocked: "error",
};

const RECEIPT_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  "not-started": "warning",
  missing: "warning",
  stale: "warning",
  ready: "success",
};

const ACCEPTANCE_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  pending: "warning",
  "receipt-path": "info",
  "ready-to-record": "info",
  accepted: "success",
  rejected: "error",
  revoked: "error",
};

const BOUNDARY_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  clear: "success",
  blocked: "error",
};

const RISK_TONES: Readonly<Record<string, PalariBadgeTone>> = {
  R1: "secondary",
  R2: "secondary",
  R3: "warning",
  R4: "error",
  R5: "error",
};

function explicitTone(
  tones: Readonly<Record<string, PalariBadgeTone>>,
  value: string,
): PalariBadgeTone {
  return tones[value] ?? "secondary";
}

export function palariAttentionTone(value: string): PalariBadgeTone {
  return explicitTone(ATTENTION_TONES, value);
}

export function palariEvidenceTone(value: string): PalariBadgeTone {
  return explicitTone(EVIDENCE_TONES, value);
}

export function palariReviewTone(value: string): PalariBadgeTone {
  return explicitTone(REVIEW_TONES, value);
}

export function palariReceiptTone(value: string): PalariBadgeTone {
  return explicitTone(RECEIPT_TONES, value);
}

export function palariAcceptanceTone(value: string): PalariBadgeTone {
  return explicitTone(ACCEPTANCE_TONES, value);
}

export function palariBoundaryTone(value: string): PalariBadgeTone {
  return explicitTone(BOUNDARY_TONES, value);
}

export function palariRiskTone(value: string): PalariBadgeTone {
  return explicitTone(RISK_TONES, value);
}

function parseApprovalProgress(
  value: string,
): { readonly current: number; readonly total: number } | null {
  const match = /^(0|[1-9]\d*)\/(0|[1-9]\d*)$/.exec(value);
  if (!match) return null;
  return { current: Number(match[1]), total: Number(match[2]) };
}

export function formatPalariApproval(value: string): string {
  const progress = parseApprovalProgress(value);
  if (!progress) return formatPalariLabel(value);
  if (progress.total === 0) return "No approval required";
  if (progress.current >= progress.total) return "Approvals complete";
  return `Approvals ${progress.current} of ${progress.total}`;
}

export function palariApprovalTone(value: string): PalariBadgeTone {
  const progress = parseApprovalProgress(value);
  if (!progress || progress.total === 0) return "secondary";
  return progress.current >= progress.total ? "success" : "warning";
}
