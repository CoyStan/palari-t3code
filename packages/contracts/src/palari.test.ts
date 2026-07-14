import { describe, expect, it } from "vite-plus/test";
import * as Schema from "effect/Schema";

import { ExecutionEnvironmentCapabilities, supportsPalariCompanyOsRead } from "./environment.ts";
import {
  PALARI_BRIDGE_PROTOCOL_VERSION,
  PalariReadOverviewResult,
  PalariStatusCode,
} from "./palari.ts";

const decodeEnvironmentCapabilities = Schema.decodeUnknownSync(ExecutionEnvironmentCapabilities);
const decodePalariReadOverviewResult = Schema.decodeUnknownSync(PalariReadOverviewResult);
const decodePalariStatusCode = Schema.decodeUnknownSync(PalariStatusCode);

describe("Palari bridge contracts", () => {
  it("treats the capability as false when an older descriptor omits it", () => {
    const decoded = decodeEnvironmentCapabilities({
      repositoryIdentity: true,
    });
    expect(decoded.palariCompanyOsRead).toBe(false);
    expect(supportsPalariCompanyOsRead(decoded)).toBe(false);
    expect(
      supportsPalariCompanyOsRead({ repositoryIdentity: true, palariCompanyOsRead: true }),
    ).toBe(true);
  });

  it("decodes the bounded operational result", () => {
    expect(
      decodePalariReadOverviewResult({
        protocolVersion: PALARI_BRIDGE_PROTOCOL_VERSION,
        status: "incompatible",
        checkedAt: "2026-07-14T00:00:00.000Z",
        code: "checkout_revision_mismatch",
        message: "The checkout revision is incompatible.",
        retryable: false,
      }).status,
    ).toBe("incompatible");
  });

  it("rejects unknown operational status codes", () => {
    expect(() => decodePalariStatusCode("raw_subprocess_error")).toThrow();
  });

  it("rejects unknown result variants", () => {
    expect(() =>
      decodePalariReadOverviewResult({
        protocolVersion: 1,
        status: "mutating",
        checkedAt: "2026-07-14T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("accepts a bounded ready overview and rejects more than fifty items", () => {
    const item = {
      id: "WORK-1",
      title: "Fixture work",
      status: "active",
      attention: "ready-for-ai-work",
      why: "The boundary is explicit.",
      goalTitle: "Fixture goal",
      workbenchLabel: "Fixture",
      owner: "Founder",
      assignedPalari: { id: "PALARI-1", name: "Lumen" },
      risk: "R2",
      intensity: "light",
      nextStepType: "start-work",
      aiSafeToProceed: true,
      waitingOnHuman: false,
      readiness: {
        evidence: "not-started",
        review: "waiting-on-evidence",
        receipt: "not-started",
        acceptance: "pending",
        approval: "0/0",
        boundary: "clear",
      },
      contentTruncated: false,
    };
    const ready = {
      protocolVersion: 1,
      status: "ready",
      checkedAt: "2026-07-14T00:00:00.000Z",
      companyOs: {
        version: "0.1.2",
        revision: "e651a3e9c9cacfc584d507a75cf3152df860d9d4",
      },
      workspace: { id: "fixture", name: "Fixture", schemaVersion: 1 },
      summary: {
        total: 1,
        needsAttention: 0,
        waitingOnHuman: 0,
        active: 1,
        reviewReady: 0,
        evidenceReady: 0,
      },
      workItems: [item],
      scopeSummary: null,
      itemsTruncated: false,
      contentTruncated: false,
    };
    expect(decodePalariReadOverviewResult(ready).status).toBe("ready");
    expect(() =>
      decodePalariReadOverviewResult({
        ...ready,
        workItems: Array.from({ length: 51 }, () => item),
      }),
    ).toThrow();
  });
});
