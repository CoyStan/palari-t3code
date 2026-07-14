import * as NodeCrypto from "node:crypto";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import { PalariReadOverviewResult } from "@t3tools/contracts";

import * as ProcessRunner from "../processRunner.ts";
import * as CompanyOsBridge from "./CompanyOsBridge.ts";

const workspaceFingerprint = Effect.fn("test.workspaceFingerprint")(function* (root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = (yield* fs.readDirectory(root, { recursive: true })).toSorted();
  const hash = NodeCrypto.createHash("sha256");
  for (const entry of entries) {
    const absolute = path.join(root, entry);
    const info = yield* fs.stat(absolute);
    if (info.type !== "File") continue;
    hash.update(entry.replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(yield* fs.readFile(absolute));
    hash.update("\0");
  }
  return hash.digest("hex");
});

describe("CompanyOsBridge pinned fixture", () => {
  it.effect("reads the validated fixture without changing its fingerprint", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const companyOsCheckout = path.resolve(process.cwd(), "../palari-company-os");
      const fixtureWorkspace = path.resolve(
        process.cwd(),
        "packages/contracts/test-fixtures/palari-readonly-v1/workspace.json",
      );
      const fixtureOverview = path.resolve(
        process.cwd(),
        "packages/contracts/test-fixtures/palari-readonly-v1/overview.json",
      );

      // CI does not clone the sibling repository. Absence is covered by a unit
      // test; this provider-free compatibility proof runs when the pinned
      // sibling checkout is present.
      if (
        !(yield* fs.exists(path.join(companyOsCheckout, "bin", "palari"))) ||
        !(yield* fs.exists(fixtureWorkspace))
      ) {
        return;
      }

      const root = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-fixture-" });
      const workspace = path.join(root, "workspace");
      yield* fs.makeDirectory(workspace);
      yield* fs.copyFile(fixtureWorkspace, path.join(workspace, "workspace.json"));
      const before = yield* workspaceFingerprint(workspace);

      const bridgeLayer = CompanyOsBridge.layerConfig({
        enabled: true,
        checkout: companyOsCheckout,
        workspaceRoot: root,
        workspace,
        workspaceId: "palari-readonly-fixture-v1",
      }).pipe(Layer.provide(ProcessRunner.layer), Layer.provideMerge(NodeServices.layer));
      const result = yield* Effect.gen(function* () {
        const bridge = yield* CompanyOsBridge.CompanyOsBridge;
        return yield* bridge.readOverview({ protocolVersion: 1 });
      }).pipe(Effect.provide(bridgeLayer));

      const after = yield* workspaceFingerprint(workspace);
      assert.strictEqual(result.status, "ready");
      assert.strictEqual(after, before);
      const expected = yield* fs
        .readFileString(fixtureOverview)
        .pipe(
          Effect.flatMap(
            Schema.decodeUnknownEffect(Schema.fromJsonString(PalariReadOverviewResult)),
          ),
        );
      assert.deepStrictEqual({ ...result, checkedAt: expected.checkedAt }, expected);
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});
