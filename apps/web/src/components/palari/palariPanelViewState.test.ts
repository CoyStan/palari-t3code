import type { PalariWorkItemOverview } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  formatPalariApproval,
  formatPalariLabel,
  orderPalariWorkItems,
  palariAcceptanceTone,
  palariApprovalTone,
  palariAttentionTone,
  palariBoundaryTone,
  palariEvidenceTone,
  palariReceiptTone,
  palariReviewTone,
  palariRiskTone,
} from "./palariPanelViewState";

function workItem(id: string, attention: string, waitingOnHuman = false): PalariWorkItemOverview {
  return {
    id,
    title: id,
    status: "open",
    attention,
    why: "Fixture",
    goalTitle: "Safe release",
    workbenchLabel: "Release",
    owner: "Founder",
    assignedPalari: { id: "palari-1", name: "Release Palari" },
    risk: "R2",
    intensity: "bounded",
    nextStepType: "inspect",
    aiSafeToProceed: true,
    waitingOnHuman,
    readiness: {
      evidence: "missing",
      review: "not-ready",
      receipt: "not-ready",
      acceptance: "not-ready",
      approval: "not-required",
      boundary: "valid",
    },
    contentTruncated: false,
  };
}

describe("Palari panel view state", () => {
  it("orders human decisions and attention states before ready work", () => {
    expect(
      orderPalariWorkItems([
        workItem("ready", "ready-for-ai-work"),
        workItem("review", "needs-review"),
        workItem("human", "needs-evidence", true),
      ]).map((item) => item.id),
    ).toEqual(["human", "review", "ready"]);
  });

  it("formats machine labels", () => {
    expect(formatPalariLabel("needs-human-decision")).toBe("Needs Human Decision");
  });

  it.each([
    ["needs-human-decision", "warning"],
    ["changes-requested", "error"],
    ["needs-review", "info"],
    ["needs-evidence", "info"],
    ["ready-to-integrate", "success"],
    ["receipt-ready", "success"],
    ["ready-for-ai-work", "success"],
    ["blocked", "error"],
    ["closed", "secondary"],
  ] as const)("maps attention state %s to %s", (value, expected) => {
    expect(palariAttentionTone(value)).toBe(expected);
  });

  it.each([
    ["not-started", "warning"],
    ["missing", "warning"],
    ["stale", "warning"],
    ["passed", "success"],
    ["failed", "error"],
    ["skipped", "secondary"],
  ] as const)("maps evidence state %s to %s", (value, expected) => {
    expect(palariEvidenceTone(value)).toBe(expected);
  });

  it.each([
    ["waiting-on-evidence", "info"],
    ["missing", "warning"],
    ["stale", "warning"],
    ["accept-ready", "success"],
    ["changes-requested", "error"],
    ["needs-human-decision", "warning"],
    ["blocked", "error"],
  ] as const)("maps review state %s to %s", (value, expected) => {
    expect(palariReviewTone(value)).toBe(expected);
  });

  it.each([
    ["not-started", "warning"],
    ["missing", "warning"],
    ["stale", "warning"],
    ["ready", "success"],
  ] as const)("maps receipt state %s to %s", (value, expected) => {
    expect(palariReceiptTone(value)).toBe(expected);
  });

  it.each([
    ["pending", "warning"],
    ["receipt-path", "info"],
    ["ready-to-record", "info"],
    ["accepted", "success"],
    ["rejected", "error"],
    ["revoked", "error"],
  ] as const)("maps acceptance state %s to %s", (value, expected) => {
    expect(palariAcceptanceTone(value)).toBe(expected);
  });

  it.each([
    ["clear", "success"],
    ["blocked", "error"],
  ] as const)("maps boundary state %s to %s", (value, expected) => {
    expect(palariBoundaryTone(value)).toBe(expected);
  });

  it.each([
    ["R1", "secondary"],
    ["R2", "secondary"],
    ["R3", "warning"],
    ["R4", "error"],
    ["R5", "error"],
  ] as const)("maps risk %s to %s", (value, expected) => {
    expect(palariRiskTone(value)).toBe(expected);
  });

  it("fails closed to a neutral tone for unknown states", () => {
    expect([
      palariAttentionTone("unknown"),
      palariEvidenceTone("unknown"),
      palariReviewTone("unknown"),
      palariReceiptTone("unknown"),
      palariAcceptanceTone("unknown"),
      palariBoundaryTone("unknown"),
      palariRiskTone("unknown"),
    ]).toEqual(Array.from({ length: 7 }, () => "secondary"));
  });

  it("does not infer success from an unknown value containing ready", () => {
    expect([
      palariAttentionTone("not-ready"),
      palariEvidenceTone("not-ready"),
      palariReviewTone("not-ready"),
      palariReceiptTone("not-ready"),
      palariAcceptanceTone("not-ready"),
      palariBoundaryTone("not-ready"),
      palariRiskTone("not-ready"),
    ]).toEqual(Array.from({ length: 7 }, () => "secondary"));
  });

  it.each([
    ["0/0", "No approval required", "secondary"],
    ["2/0", "No approval required", "secondary"],
    ["0/1", "Approvals 0 of 1", "warning"],
    ["1/2", "Approvals 1 of 2", "warning"],
    ["1/1", "Approvals complete", "success"],
    ["2/1", "Approvals complete", "success"],
    ["not_required", "Not Required", "secondary"],
  ] as const)("formats approval progress %s", (value, label, tone) => {
    expect(formatPalariApproval(value)).toBe(label);
    expect(palariApprovalTone(value)).toBe(tone);
  });
});
