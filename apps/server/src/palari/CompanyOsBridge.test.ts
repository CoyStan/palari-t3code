import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as ChildProcessSpawner from "effect/unstable/process/ChildProcessSpawner";

import type { PalariReadOverviewResult } from "@t3tools/contracts";

import * as ProcessRunner from "../processRunner.ts";
import * as CompanyOsBridge from "./CompanyOsBridge.ts";

const queueItem = {
  id: "WORK-TEST-001",
  title: "Review the fictional boundary",
  status: "needs-human",
  attention: "needs-human-decision",
  why: "A founder decision is required.",
  goal_title: "Keep authority explicit",
  workbench_label: "Fixture Workbench",
  owner: "Avery Founder",
  palari: "PALARI-TEST-LUMEN",
  palari_name: "Lumen",
  risk: "R4",
  intensity: "high",
  next_step_type: "human-decision",
  ai_safe_to_proceed: false,
  waiting_on_human: true,
  evidence_state: "passed",
  review_state: "accept-ready",
  receipt_state: "ready",
  acceptance_state: "pending",
  approval_progress: "0/1",
  scope_overlap_state: "clear",
};

const queueJson = JSON.stringify({ workspace: "Fixture Workspace", queue: [queueItem] });
const briefJson = JSON.stringify({
  schema_version: CompanyOsBridge.PINNED_AGENT_PACKET_SCHEMA,
  workspace: "Fixture Workspace",
  work_item: { id: queueItem.id, objective: "Keep the fictional boundary explicit." },
  allowed_paths: { read: ["fixture/input.md"], write: ["fixture/output.md"] },
  allowed_sources: [{ id: "SOURCE-TEST-001" }],
  forbidden_actions: ["deploy", "accept work"],
  required_output: { output_targets: ["fixture/output.md"] },
  completion_contract: {
    external_writes_allowed: false,
    requires_evidence: true,
    requires_human_decision: true,
    requires_receipt: true,
    requires_review: true,
  },
});

const serializeForAssertion = (value: unknown): string => JSON.stringify(value);

const processOutput = (
  stdout: string,
  options?: { readonly code?: number; readonly stderr?: string },
): ProcessRunner.ProcessRunOutput => ({
  stdout,
  stderr: options?.stderr ?? "",
  code: ChildProcessSpawner.ExitCode(options?.code ?? 0),
  timedOut: false,
  stdoutTruncated: false,
  stderrTruncated: false,
});

function bridgeLayer(
  config: CompanyOsBridge.CompanyOsBridgeConfig,
  run: ProcessRunner.ProcessRunner["Service"]["run"],
) {
  return CompanyOsBridge.layerConfig(config).pipe(
    Layer.provide(
      Layer.succeed(ProcessRunner.ProcessRunner, ProcessRunner.ProcessRunner.of({ run })),
    ),
    Layer.provideMerge(NodeServices.layer),
  );
}

const readOverview = (
  config: CompanyOsBridge.CompanyOsBridgeConfig,
  run: ProcessRunner.ProcessRunner["Service"]["run"],
  protocolVersion = 1,
) =>
  Effect.gen(function* () {
    const bridge = yield* CompanyOsBridge.CompanyOsBridge;
    return yield* bridge.readOverview({ protocolVersion });
  }).pipe(Effect.provide(bridgeLayer(config, run)));

const makeConfiguredWorkspace = Effect.fn("test.makeConfiguredWorkspace")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-root-" });
  const workspace = `${root}/workspace`;
  const checkout = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-checkout-" });
  yield* fs.makeDirectory(workspace, { recursive: true });
  yield* fs.makeDirectory(`${checkout}/bin`, { recursive: true });
  yield* fs.writeFileString(
    `${workspace}/workspace.json`,
    '{"schema_version":1,"name":"Fixture Workspace"}\n',
  );
  yield* fs.writeFileString(`${checkout}/bin/palari`, "#!/usr/bin/env python3\n");
  return {
    enabled: true,
    checkout,
    workspaceRoot: root,
    workspace,
    workspaceId: "fixture-v1",
  } satisfies CompanyOsBridge.CompanyOsBridgeConfig;
});

const successfulRunner =
  (seen?: Array<ProcessRunner.ProcessRunInput>): ProcessRunner.ProcessRunner["Service"]["run"] =>
  (input) =>
    Effect.sync(() => {
      seen?.push(input);
      if (input.command === "git") {
        return processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`);
      }
      if (input.args.includes("brief")) return processOutput(briefJson);
      return processOutput(queueJson);
    });

describe("CompanyOsBridge", () => {
  it("exposes only the two read-only allowlisted argv shapes", () => {
    assert.deepStrictEqual(CompanyOsBridge.PALARI_READ_OPERATIONS, ["queue", "agent-brief"]);
    assert.deepStrictEqual(CompanyOsBridge.buildPalariReadArgs("queue", { workspace: "/ws" }), [
      "--workspace",
      "/ws",
      "queue",
      "--json",
    ]);
    assert.deepStrictEqual(
      CompanyOsBridge.buildPalariReadArgs("agent-brief", {
        workspace: "/ws",
        workItemId: "WORK-1",
        palariId: "PALARI-1",
      }),
      [
        "--workspace",
        "/ws",
        "agent",
        "brief",
        "WORK-1",
        "--as",
        "PALARI-1",
        "--mode",
        "execute",
        "--json",
      ],
    );
    assert.isUndefined(CompanyOsBridge.buildPalariReadArgs("finish", { workspace: "/ws" }));
  });

  it.effect("returns bounded disabled and protocol mismatch states without spawning", () =>
    Effect.gen(function* () {
      const run = () => Effect.die("unexpected process");
      const disabled = yield* readOverview({ enabled: false }, run);
      const incompatible = yield* readOverview({ enabled: false }, run, 99);
      assert.strictEqual(disabled.status, "disabled");
      assert.strictEqual(incompatible.status, "incompatible");
      if (incompatible.status !== "ready") {
        assert.strictEqual(incompatible.code, "bridge_protocol_unsupported");
      }
    }),
  );

  it.effect(
    "normalizes a successful queue and packet without forwarding raw paths or commands",
    () =>
      Effect.gen(function* () {
        const config = yield* makeConfiguredWorkspace();
        const seen: Array<ProcessRunner.ProcessRunInput> = [];
        const result = yield* readOverview(config, successfulRunner(seen));

        assert.strictEqual(result.status, "ready");
        if (result.status !== "ready") return;
        assert.strictEqual(result.summary.total, 1);
        assert.strictEqual(result.summary.reviewReady, 1);
        assert.strictEqual(result.summary.evidenceReady, 1);
        assert.strictEqual(result.workItems[0]?.waitingOnHuman, true);
        assert.deepStrictEqual(result.scopeSummary, {
          workItemId: "WORK-TEST-001",
          objective: "Keep the fictional boundary explicit.",
          readPathCount: 1,
          writePathCount: 1,
          sourceCount: 1,
          forbiddenActionCount: 2,
          requiredOutputCount: 1,
          requiresEvidence: true,
          requiresReview: true,
          requiresReceipt: true,
          requiresHumanDecision: true,
          externalWritesAllowed: false,
          contentTruncated: false,
        });
        const serialized = serializeForAssertion(result);
        assert.notInclude(serialized, "fixture/input.md");
        assert.notInclude(serialized, "palari agent");
        assert.isTrue(seen.every((input) => input.extendEnv === false));
        assert.isTrue(seen.every((input) => input.outputMode === "error"));
        assert.strictEqual(seen[1]?.maxOutputBytes, 512 * 1024);
        assert.strictEqual(seen[2]?.maxOutputBytes, 512 * 1024);
      }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("supports an empty queue without requesting an agent packet", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      let calls = 0;
      const result = yield* readOverview(config, (input) =>
        Effect.sync(() => {
          calls += 1;
          return input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : processOutput('{"workspace":"Fixture Workspace","queue":[]}');
        }),
      );
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.strictEqual(result.summary.total, 0);
        assert.isNull(result.scopeSummary);
      }
      assert.strictEqual(calls, 2);
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("reports missing checkouts without attempting a process", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const root = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-missing-" });
      const result = yield* readOverview(
        {
          enabled: true,
          checkout: `${root}/absent-company-os`,
          workspaceRoot: root,
          workspace: root,
          workspaceId: "fixture-v1",
        },
        () => Effect.die("unexpected process"),
      );
      assertOperationalCode(result, "checkout_missing");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("reports missing CLI and workspace configuration separately", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const root = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-missing-parts-" });
      const missingCli = yield* readOverview(
        {
          enabled: true,
          checkout: root,
          workspaceRoot: root,
          workspace: root,
          workspaceId: "fixture-v1",
        },
        () => Effect.die("unexpected process"),
      );
      assertOperationalCode(missingCli, "cli_missing");

      yield* fs.makeDirectory(`${root}/bin`, { recursive: true });
      yield* fs.writeFileString(`${root}/bin/palari`, "fixture\n");
      const missingWorkspace = yield* readOverview({ enabled: true, checkout: root }, () =>
        Effect.die("unexpected process"),
      );
      assertOperationalCode(missingWorkspace, "workspace_missing");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("rejects lexical outside-root paths and canonical symlink escapes distinctly", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const config = yield* makeConfiguredWorkspace();
      const outside = yield* fs.makeTempDirectoryScoped({ prefix: "t3-palari-outside-" });
      yield* fs.writeFileString(
        `${outside}/workspace.json`,
        '{"schema_version":1,"name":"Outside"}\n',
      );
      const lexical = yield* readOverview({ ...config, workspace: outside }, successfulRunner());
      assert.strictEqual(lexical.status, "invalid");
      if (lexical.status !== "ready") assert.strictEqual(lexical.code, "workspace_outside_root");

      const linked = `${config.workspaceRoot}/linked-workspace`;
      yield* fs.symlink(outside, linked);
      const symlink = yield* readOverview({ ...config, workspace: linked }, successfulRunner());
      assert.strictEqual(symlink.status, "invalid");
      if (symlink.status !== "ready") assert.strictEqual(symlink.code, "workspace_symlink_escape");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("fails closed for stale revisions, malformed JSON, and schema mismatches", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      const stale = yield* readOverview(config, () =>
        Effect.succeed(processOutput(`${"a".repeat(40)}\n`)),
      );
      assertOperationalCode(stale, "checkout_revision_mismatch");

      const malformed = yield* readOverview(config, (input) =>
        Effect.succeed(
          input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : processOutput("not-json"),
        ),
      );
      assertOperationalCode(malformed, "malformed_json");

      const mismatch = yield* readOverview(config, (input) =>
        Effect.succeed(
          input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : processOutput('{"workspace":"Fixture Workspace","queue":[{}]}'),
        ),
      );
      assertOperationalCode(mismatch, "queue_schema_mismatch");

      const packetMismatch = yield* readOverview(config, (input) =>
        Effect.succeed(
          input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : input.args.includes("brief")
              ? processOutput('{"schema_version":"palari.agent_packet.v2"}')
              : processOutput(queueJson),
        ),
      );
      assertOperationalCode(packetMismatch, "packet_schema_mismatch");

      yield* FileSystem.FileSystem.pipe(
        Effect.flatMap((fs) =>
          fs.writeFileString(
            `${config.workspace}/workspace.json`,
            '{"schema_version":2,"name":"Future Workspace"}\n',
          ),
        ),
      );
      const workspaceMismatch = yield* readOverview(config, successfulRunner());
      assertOperationalCode(workspaceMismatch, "workspace_schema_unsupported");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("maps generic process failures without exposing process details", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      const result = yield* readOverview(config, () =>
        Effect.fail(
          new ProcessRunner.ProcessSpawnError({
            command: "/private/secret-command",
            argumentCount: 3,
            cause: new Error("TOKEN=secret"),
          }),
        ),
      );
      assertOperationalCode(result, "process_failed");
      assert.notInclude(serializeForAssertion(result), "secret-command");
      assert.notInclude(serializeForAssertion(result), "TOKEN");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("clips long text and bounds normalized results to fifty items under 256 KiB", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      const items = Array.from({ length: 51 }, (_, index) => ({
        ...queueItem,
        id: `WORK-TEST-${String(index).padStart(3, "0")}`,
        title: "t".repeat(400),
        why: "w".repeat(800),
      }));
      const manyQueueJson = serializeForAssertion({ workspace: "Fixture Workspace", queue: items });
      const result = yield* readOverview(config, (input) =>
        Effect.succeed(
          input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : input.args.includes("brief")
              ? processOutput(briefJson)
              : processOutput(manyQueueJson),
        ),
      );
      assert.strictEqual(result.status, "ready");
      if (result.status !== "ready") return;
      assert.lengthOf(result.workItems, 50);
      assert.isTrue(result.itemsTruncated);
      assert.isTrue(result.contentTruncated);
      assert.strictEqual(result.workItems[0]?.title.length, 256);
      assert.strictEqual(result.workItems[0]?.why.length, 512);
      assert.isBelow(Buffer.byteLength(serializeForAssertion(result)), 256 * 1024 + 1);
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("maps timeout and oversized output errors to fixed redacted states", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      const timeout = yield* readOverview(config, () =>
        Effect.fail(
          new ProcessRunner.ProcessTimeoutError({
            command: "secret-command",
            argumentCount: 2,
            timeoutMs: 5_000,
          }),
        ),
      );
      assertOperationalCode(timeout, "timed_out");
      assert.notInclude(serializeForAssertion(timeout), "secret-command");

      const oversized = yield* readOverview(config, () =>
        Effect.fail(
          new ProcessRunner.ProcessOutputLimitError({
            command: "secret-command",
            argumentCount: 1,
            stream: "stderr",
            maxBytes: 512 * 1024,
            observedBytes: 512 * 1024 + 1,
          }),
        ),
      );
      assertOperationalCode(oversized, "output_too_large");
      assert.notInclude(serializeForAssertion(oversized), "secret-command");
    }).pipe(Effect.provide(NodeServices.layer)),
  );

  it.effect("does not surface CLI stderr from an invalid workspace", () =>
    Effect.gen(function* () {
      const config = yield* makeConfiguredWorkspace();
      const result = yield* readOverview(config, (input) =>
        Effect.succeed(
          input.command === "git"
            ? processOutput(`${CompanyOsBridge.PINNED_COMPANY_OS_REVISION}\n`)
            : processOutput("", { code: 2, stderr: "TOKEN=super-secret /private/path" }),
        ),
      );
      assertOperationalCode(result, "workspace_invalid");
      assert.notInclude(serializeForAssertion(result), "super-secret");
      assert.notInclude(serializeForAssertion(result), "/private/path");
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});

function assertOperationalCode(
  result: PalariReadOverviewResult,
  code: Exclude<PalariReadOverviewResult, { readonly status: "ready" }>["code"],
): void {
  assert.notStrictEqual(result.status, "ready");
  if (result.status !== "ready") assert.strictEqual(result.code, code);
}
