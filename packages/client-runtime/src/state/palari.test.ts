import { PALARI_BRIDGE_PROTOCOL_VERSION } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { PALARI_OVERVIEW_QUERY_POLICY, PALARI_READ_OVERVIEW_INPUT } from "./palari.ts";

describe("Palari environment query policy", () => {
  it("pins the bridge protocol request", () => {
    expect(PALARI_READ_OVERVIEW_INPUT).toEqual({
      protocolVersion: PALARI_BRIDGE_PROTOCOL_VERSION,
    });
  });

  it("uses bounded caching with manual refresh and no polling", () => {
    expect(PALARI_OVERVIEW_QUERY_POLICY).toEqual({
      staleTimeMs: 30_000,
      idleTtlMs: 5 * 60_000,
      refreshIntervalMs: null,
    });
  });
});
