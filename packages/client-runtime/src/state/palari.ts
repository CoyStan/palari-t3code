import { PALARI_BRIDGE_PROTOCOL_VERSION, WS_METHODS } from "@t3tools/contracts";
import { Atom } from "effect/unstable/reactivity";

import type { EnvironmentRegistry } from "../connection/registry.ts";
import { createEnvironmentRpcQueryAtomFamily } from "./runtime.ts";

export const PALARI_OVERVIEW_QUERY_POLICY = Object.freeze({
  staleTimeMs: 30_000,
  idleTtlMs: 5 * 60_000,
  refreshIntervalMs: null,
});

export const PALARI_READ_OVERVIEW_INPUT = Object.freeze({
  protocolVersion: PALARI_BRIDGE_PROTOCOL_VERSION,
});

export function createPalariEnvironmentAtoms<R, E>(
  runtime: Atom.AtomRuntime<EnvironmentRegistry | R, E>,
) {
  return {
    overview: createEnvironmentRpcQueryAtomFamily(runtime, {
      label: "environment-data:palari:overview",
      tag: WS_METHODS.palariReadOverview,
      staleTimeMs: PALARI_OVERVIEW_QUERY_POLICY.staleTimeMs,
      idleTtlMs: PALARI_OVERVIEW_QUERY_POLICY.idleTtlMs,
    }),
  };
}
