import type {
  PalariOperationalState,
  PalariOperationalStatus,
  PalariReadyOverview,
  PalariStatusCode,
  PalariWorkItemOverview,
} from "@t3tools/contracts";

export const PALARI_TEST_CHECKED_AT = "2026-07-14T12:00:00.000Z";

function textAtLength(seed: string, length: number): string {
  return seed.repeat(Math.ceil(length / seed.length)).slice(0, length);
}

export const PALARI_MAX_SHORT_TEXT = textAtLength("Fictional founder governance boundary ", 256);
export const PALARI_MAX_LONG_TEXT = textAtLength(
  "This fictional governance explanation remains local, bounded, and safe to wrap. ",
  512,
);

function readyWorkItem(overrides: Partial<PalariWorkItemOverview> = {}): PalariWorkItemOverview {
  return {
    id: "WORK-FIXTURE-002",
    title: "Choose the fictional publication boundary",
    status: "needs-human",
    attention: "needs-human-decision",
    why: "A fictional publication-boundary decision is open for this work item.",
    goalTitle: "Demonstrate bounded founder-supervised work",
    workbenchLabel: "Read-Only Bridge Fixture",
    owner: "Avery Founder",
    assignedPalari: {
      id: "PALARI-FIXTURE-LUMEN",
      name: "Lumen",
    },
    risk: "R4",
    intensity: "high",
    nextStepType: "human-decision",
    aiSafeToProceed: false,
    waitingOnHuman: true,
    readiness: {
      evidence: "not-started",
      review: "waiting-on-evidence",
      receipt: "not-started",
      acceptance: "pending",
      approval: "0/1",
      boundary: "clear",
    },
    contentTruncated: false,
    ...overrides,
  };
}

export function buildReadyAttentionOverview(): PalariReadyOverview {
  return {
    protocolVersion: 1,
    status: "ready",
    checkedAt: PALARI_TEST_CHECKED_AT,
    companyOs: {
      version: "0.1.2",
      revision: "e651a3e9c9cacfc584d507a75cf3152df860d9d4",
    },
    workspace: {
      id: "palari-visual-fixture-v1",
      name: "Fictional Release Workspace",
      schemaVersion: 1,
    },
    summary: {
      total: 2,
      needsAttention: 1,
      waitingOnHuman: 1,
      active: 1,
      reviewReady: 0,
      evidenceReady: 0,
    },
    workItems: [
      readyWorkItem(),
      readyWorkItem({
        id: "WORK-FIXTURE-001",
        title: "Draft a fictional fixture summary",
        status: "active",
        attention: "ready-for-ai-work",
        why: "No execution attempt exists yet.",
        risk: "R2",
        intensity: "light",
        nextStepType: "start-work",
        aiSafeToProceed: true,
        waitingOnHuman: false,
        readiness: {
          evidence: "not-started",
          review: "waiting-on-evidence",
          receipt: "not-started",
          acceptance: "receipt-path",
          approval: "0/0",
          boundary: "clear",
        },
      }),
    ],
    scopeSummary: {
      workItemId: "WORK-FIXTURE-002",
      objective:
        "Record whether fictional fixture output could ever be published outside the local workspace.",
      readPathCount: 1,
      writePathCount: 1,
      sourceCount: 1,
      forbiddenActionCount: 6,
      requiredOutputCount: 1,
      requiresEvidence: true,
      requiresReview: true,
      requiresReceipt: true,
      requiresHumanDecision: true,
      externalWritesAllowed: false,
      contentTruncated: false,
    },
    itemsTruncated: false,
    contentTruncated: false,
  };
}

export function buildReadyNoAttentionOverview(): PalariReadyOverview {
  const overview = buildReadyAttentionOverview();
  return {
    ...overview,
    summary: {
      total: 1,
      needsAttention: 0,
      waitingOnHuman: 0,
      active: 1,
      reviewReady: 0,
      evidenceReady: 0,
    },
    workItems: [
      readyWorkItem({
        id: "WORK-FIXTURE-003",
        title: "Continue the fictional bounded draft",
        status: "active",
        attention: "ready-for-ai-work",
        why: "The fictional work remains inside its approved local boundary.",
        risk: "R2",
        intensity: "light",
        nextStepType: "start-work",
        aiSafeToProceed: true,
        waitingOnHuman: false,
        readiness: {
          evidence: "not-started",
          review: "waiting-on-evidence",
          receipt: "not-started",
          acceptance: "receipt-path",
          approval: "0/0",
          boundary: "clear",
        },
      }),
    ],
    scopeSummary: {
      ...overview.scopeSummary!,
      workItemId: "WORK-FIXTURE-003",
      objective: "Continue the fictional bounded draft without changing Company OS records.",
      requiresHumanDecision: false,
    },
  };
}

export function buildReadyGovernanceAttentionOverview(): PalariReadyOverview {
  const overview = buildReadyNoAttentionOverview();
  return {
    ...overview,
    summary: {
      ...overview.summary,
      needsAttention: 1,
      active: 0,
    },
    workItems: [
      readyWorkItem({
        id: "WORK-FIXTURE-004",
        title: "Gather fictional boundary evidence",
        status: "in-review",
        attention: "needs-evidence",
        why: "The fictional evidence bundle is not complete yet.",
        risk: "R2",
        intensity: "light",
        nextStepType: "check-active-proof",
        aiSafeToProceed: false,
        waitingOnHuman: false,
        readiness: {
          evidence: "missing",
          review: "waiting-on-evidence",
          receipt: "missing",
          acceptance: "receipt-path",
          approval: "0/0",
          boundary: "clear",
        },
      }),
    ],
    scopeSummary: {
      ...overview.scopeSummary!,
      workItemId: "WORK-FIXTURE-004",
      objective: "Gather fictional boundary evidence without changing Company OS records.",
    },
  };
}

export function buildEmptyOverview(): PalariReadyOverview {
  const overview = buildReadyAttentionOverview();
  return {
    ...overview,
    summary: {
      total: 0,
      needsAttention: 0,
      waitingOnHuman: 0,
      active: 0,
      reviewReady: 0,
      evidenceReady: 0,
    },
    workItems: [],
    scopeSummary: null,
    itemsTruncated: false,
    contentTruncated: false,
  };
}

const OPERATIONAL_FIXTURES = {
  disabled: {
    code: "disabled",
    message: "Palari Company OS is disabled for this environment.",
    retryable: false,
  },
  unavailable: {
    code: "checkout_missing",
    message: "The configured Company OS checkout is unavailable.",
    retryable: true,
  },
  incompatible: {
    code: "checkout_revision_mismatch",
    message: "The configured Company OS checkout is incompatible with this bridge.",
    retryable: false,
  },
  invalid: {
    code: "workspace_invalid",
    message: "The configured Company OS workspace is invalid.",
    retryable: false,
  },
} as const satisfies Record<
  PalariOperationalState,
  { code: PalariStatusCode; message: string; retryable: boolean }
>;

export function buildOperationalOverview(status: PalariOperationalState): PalariOperationalStatus {
  return {
    protocolVersion: 1,
    status,
    checkedAt: PALARI_TEST_CHECKED_AT,
    ...OPERATIONAL_FIXTURES[status],
  };
}

export function buildMaxTextOverview(): PalariReadyOverview {
  const overview = buildReadyAttentionOverview();
  return {
    ...overview,
    workspace: {
      ...overview.workspace,
      name: PALARI_MAX_SHORT_TEXT,
    },
    summary: {
      ...overview.summary,
      total: 1,
    },
    workItems: [
      readyWorkItem({
        id: "WORK-FIXTURE-MAX-TEXT",
        title: PALARI_MAX_SHORT_TEXT,
        why: PALARI_MAX_LONG_TEXT,
        goalTitle: PALARI_MAX_SHORT_TEXT,
        workbenchLabel: PALARI_MAX_SHORT_TEXT,
        owner: PALARI_MAX_SHORT_TEXT,
        assignedPalari: {
          id: "PALARI-FIXTURE-MAX-TEXT",
          name: PALARI_MAX_SHORT_TEXT,
        },
      }),
    ],
    scopeSummary: {
      ...overview.scopeSummary!,
      workItemId: "WORK-FIXTURE-MAX-TEXT",
      objective: PALARI_MAX_LONG_TEXT,
    },
  };
}

export function buildMaxItemsOverview(): PalariReadyOverview {
  const overview = buildReadyAttentionOverview();
  const attentionItem = readyWorkItem({
    id: "WORK-FIXTURE-001",
    title: "Attention item 01: choose the fictional publication boundary",
  });
  const remainingItems = Array.from({ length: 49 }, (_, index) => {
    const ordinal = String(index + 2).padStart(2, "0");
    return readyWorkItem({
      id: `WORK-FIXTURE-${ordinal}`,
      title: `Fictional governed work item ${ordinal}`,
      status: "active",
      attention: "ready-for-ai-work",
      why: `Fictional work item ${ordinal} is safe to observe inside its approved boundary.`,
      risk: "R2",
      intensity: "light",
      nextStepType: "inspect",
      aiSafeToProceed: true,
      waitingOnHuman: false,
      readiness: {
        evidence: "not-started",
        review: "waiting-on-evidence",
        receipt: "not-started",
        acceptance: "receipt-path",
        approval: "0/0",
        boundary: "clear",
      },
    });
  });
  return {
    ...overview,
    summary: {
      total: 50,
      needsAttention: 1,
      waitingOnHuman: 1,
      active: 49,
      reviewReady: 0,
      evidenceReady: 0,
    },
    workItems: [attentionItem, ...remainingItems],
    scopeSummary: {
      ...overview.scopeSummary!,
      workItemId: attentionItem.id,
    },
    itemsTruncated: true,
  };
}
