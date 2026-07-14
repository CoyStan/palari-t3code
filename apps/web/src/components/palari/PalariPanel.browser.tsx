import "../../index.css";

import type { PalariOperationalStatus, PalariReadyOverview } from "@t3tools/contracts";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { cleanup, render } from "vitest-browser-react";

import { RightPanelSheet } from "../RightPanelSheet";
import { RightPanelTabs } from "../RightPanelTabs";
import { PalariPanelView } from "./PalariPanelView";

const LONG_LABEL =
  "Release governance boundary with a deliberately long founder-facing label ".repeat(4);

const readyOverview: PalariReadyOverview = {
  protocolVersion: 1,
  status: "ready",
  checkedAt: "2026-07-14T12:00:00.000Z",
  companyOs: {
    version: "0.1.2",
    revision: "e651a3e9c9cacfc584d507a75cf3152df860d9d4",
  },
  workspace: { id: "fictional-workspace", name: "Fictional Release Workspace", schemaVersion: 1 },
  summary: {
    total: 1,
    needsAttention: 1,
    waitingOnHuman: 1,
    active: 1,
    reviewReady: 0,
    evidenceReady: 0,
  },
  workItems: [
    {
      id: "work-item-1",
      title: LONG_LABEL,
      status: "in-progress",
      attention: "needs-human-decision",
      why: LONG_LABEL,
      goalTitle: "Ship safely",
      workbenchLabel: LONG_LABEL,
      owner: "Founder",
      assignedPalari: { id: "release-palari", name: LONG_LABEL },
      risk: "R2",
      intensity: "bounded",
      nextStepType: "human-decision",
      aiSafeToProceed: false,
      waitingOnHuman: true,
      readiness: {
        evidence: "missing",
        review: "not-ready",
        receipt: "not-ready",
        acceptance: "not-ready",
        approval: "human-required",
        boundary: "valid",
      },
      contentTruncated: true,
    },
  ],
  scopeSummary: {
    workItemId: "work-item-1",
    objective: LONG_LABEL,
    readPathCount: 4,
    writePathCount: 2,
    sourceCount: 3,
    forbiddenActionCount: 5,
    requiredOutputCount: 1,
    requiresEvidence: true,
    requiresReview: true,
    requiresReceipt: true,
    requiresHumanDecision: true,
    externalWritesAllowed: false,
    contentTruncated: true,
  },
  itemsTruncated: false,
  contentTruncated: true,
};

const unavailableOverview: PalariOperationalStatus = {
  protocolVersion: 1,
  status: "unavailable",
  checkedAt: "2026-07-14T12:00:00.000Z",
  code: "checkout_missing",
  message: "The configured Company OS checkout is unavailable.",
  retryable: true,
};

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 720);
});

describe("PalariPanelView", () => {
  it("renders the compact read-only desktop overview and refreshes from the keyboard", async () => {
    await page.viewport(1440, 900);
    const onRefresh = vi.fn();
    await render(
      <div style={{ width: 448, height: 820 }}>
        <PalariPanelView
          overview={readyOverview}
          error={null}
          isPending={false}
          onRefresh={onRefresh}
        />
      </div>,
    );

    await expect.element(page.getByRole("heading", { name: "Palari Company OS" })).toBeVisible();
    await expect.element(page.getByText("Human decision required")).toBeVisible();
    await userEvent.keyboard("{Tab}");
    const refresh = page.getByRole("button", { name: "Refresh Palari governance overview" });
    expect(document.activeElement).toBe(refresh.element());
    await userEvent.keyboard("{Enter}");
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const panel = document.querySelector<HTMLElement>("[data-palari-panel]");
    expect(panel).not.toBeNull();
    expect(panel!.scrollWidth).toBeLessThanOrEqual(panel!.clientWidth);
    expect(document.body.textContent).not.toMatch(
      /\b(claim|start|finish|accept|merge|push|deploy)\b/i,
    );
  });

  it("keeps the mobile sheet bounded, closes on Escape, and restores focus", async () => {
    await page.viewport(390, 844);

    function MobileHarness() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            Open Palari
          </button>
          {open ? (
            <RightPanelSheet open onClose={() => setOpen(false)}>
              <PalariPanelView
                overview={readyOverview}
                error={null}
                isPending={false}
                onRefresh={() => undefined}
              />
            </RightPanelSheet>
          ) : null}
        </>
      );
    }

    render(<MobileHarness />);
    const trigger = page.getByRole("button", { name: "Open Palari" });
    await trigger.click();
    await expect.element(page.getByRole("heading", { name: "Palari Company OS" })).toBeVisible();

    const popup = document.querySelector<HTMLElement>("[data-slot=sheet-popup]");
    expect(popup).not.toBeNull();
    expect(popup!.scrollWidth).toBeLessThanOrEqual(popup!.clientWidth);

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(document.querySelector("[data-palari-panel]")).toBeNull();
      expect(document.activeElement).toBe(trigger.element());
    });
  });

  it("announces bounded loading and unavailable states without mutation controls", async () => {
    const screen = await render(
      <div style={{ width: 390, height: 640 }}>
        <PalariPanelView overview={null} error={null} isPending onRefresh={() => undefined} />
      </div>,
    );
    await expect
      .element(page.getByText("Refreshing Palari governance overview"))
      .toBeInTheDocument();

    await screen.rerender(
      <div style={{ width: 390, height: 640 }}>
        <PalariPanelView
          overview={unavailableOverview}
          error={null}
          isPending={false}
          onRefresh={() => undefined}
        />
      </div>,
    );
    await expect.element(page.getByRole("alert")).toHaveTextContent("Unavailable");
    expect(document.querySelectorAll("button")).toHaveLength(1);
  });

  it("renders empty, invalid, and incompatible states explicitly", async () => {
    const screen = await render(
      <div style={{ width: 390, height: 640 }}>
        <PalariPanelView
          overview={{
            ...readyOverview,
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
            contentTruncated: false,
          }}
          error={null}
          isPending={false}
          onRefresh={() => undefined}
        />
      </div>,
    );
    await expect.element(page.getByText("No current work items")).toBeVisible();

    await screen.rerender(
      <PalariPanelView
        overview={{
          ...unavailableOverview,
          status: "invalid",
          code: "workspace_invalid",
          message: "The configured workspace is invalid.",
          retryable: false,
        }}
        error={null}
        isPending={false}
        onRefresh={() => undefined}
      />,
    );
    await expect.element(page.getByRole("alert")).toHaveTextContent("Invalid");

    await screen.rerender(
      <PalariPanelView
        overview={{
          ...unavailableOverview,
          status: "incompatible",
          code: "checkout_revision_mismatch",
          message: "The configured checkout is incompatible.",
          retryable: false,
        }}
        error={null}
        isPending={false}
        onRefresh={() => undefined}
      />,
    );
    await expect.element(page.getByRole("alert")).toHaveTextContent("Incompatible");
  });

  it("opens the surface menu and selects Palari with the keyboard", async () => {
    const onAddPalari = vi.fn();
    await render(
      <div style={{ width: 448, height: 640 }}>
        <RightPanelTabs
          mode="inline"
          surfaces={[{ id: "plan", kind: "plan" }]}
          activeSurfaceId="plan"
          pendingSurfaceIds={new Set()}
          previewSessions={{}}
          terminalLabelsById={new Map()}
          onActivate={() => undefined}
          onCloseSurface={() => undefined}
          onCloseOtherSurfaces={() => undefined}
          onCloseSurfacesToRight={() => undefined}
          onCloseAllSurfaces={() => undefined}
          onCopyFilePath={() => undefined}
          onAddBrowser={() => undefined}
          onAddTerminal={() => undefined}
          onAddDiff={() => undefined}
          onAddFiles={() => undefined}
          onAddPalari={onAddPalari}
          browserAvailable
          diffAvailable
          filesAvailable
          palariAvailable
        >
          <div>Plan surface</div>
        </RightPanelTabs>
      </div>,
    );

    const trigger = page.getByRole("button", { name: "Add panel surface" });
    await expect.element(trigger).toBeVisible();
    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    const palariItem = page.getByRole("menuitem", { name: "Palari" });
    await expect.element(palariItem).toBeVisible();
    palariItem.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(onAddPalari).toHaveBeenCalledTimes(1);
  });
});
