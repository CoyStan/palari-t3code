import type { PalariWorkItemOverview } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { formatPalariLabel, orderPalariWorkItems, palariStateTone } from "./palariPanelViewState";

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

  it("formats machine labels and assigns semantic badge tones", () => {
    expect(formatPalariLabel("needs-human-decision")).toBe("Needs Human Decision");
    expect(palariStateTone("passed")).toBe("success");
    expect(palariStateTone("blocked")).toBe("error");
    expect(palariStateTone("human-required")).toBe("warning");
  });
});
