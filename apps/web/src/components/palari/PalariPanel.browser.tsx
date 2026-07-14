import "../../index.css";

import type { PalariReadOverviewResult } from "@t3tools/contracts";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { cleanup, render } from "vitest-browser-react";

import { RightPanelSheet } from "../RightPanelSheet";
import { RightPanelTabs } from "../RightPanelTabs";
import { PalariPanelView } from "./PalariPanelView";
import {
  buildEmptyOverview,
  buildMaxItemsOverview,
  buildMaxTextOverview,
  buildOperationalOverview,
  buildReadyAttentionOverview,
  buildReadyNoAttentionOverview,
  PALARI_MAX_LONG_TEXT,
  PALARI_MAX_SHORT_TEXT,
  PALARI_TEST_CHECKED_AT,
} from "./palariPanelTestFixtures";

const DESKTOP_PANEL_WIDTH = 448;
const MOBILE_VIEWPORT_WIDTH = 390;
const MOBILE_PANEL_MAX_WIDTH = Math.min(MOBILE_VIEWPORT_WIDTH * 0.88, 384);
const FORBIDDEN_CONTROL_NAMES = [
  "claim",
  "start",
  "finish",
  "accept",
  "merge",
  "push",
  "deploy",
  "configure",
] as const;

function PanelFrame(props: {
  readonly overview: PalariReadOverviewResult | null;
  readonly error?: string | null;
  readonly isPending?: boolean;
  readonly onRefresh?: () => void;
  readonly width?: number;
  readonly height?: number;
}) {
  return (
    <div
      data-palari-test-frame
      style={{
        display: "flex",
        width: props.width ?? DESKTOP_PANEL_WIDTH,
        height: props.height ?? 820,
      }}
    >
      <PalariPanelView
        overview={props.overview}
        error={props.error ?? null}
        isPending={props.isPending ?? false}
        onRefresh={props.onRefresh ?? (() => undefined)}
      />
    </div>
  );
}

function MobileHarness({ overview }: { readonly overview: PalariReadOverviewResult }) {
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
            overview={overview}
            error={null}
            isPending={false}
            onRefresh={() => undefined}
          />
        </RightPanelSheet>
      ) : null}
    </>
  );
}

function InlinePalariHarness({ overview }: { readonly overview: PalariReadOverviewResult }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", width: 900, height: 820 }}>
      <RightPanelTabs
        mode="inline"
        surfaces={[{ id: "palari", kind: "palari" }]}
        activeSurfaceId="palari"
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
        onAddPalari={() => undefined}
        browserAvailable
        diffAvailable
        filesAvailable
        palariAvailable
      >
        <PalariPanelView
          overview={overview}
          error={null}
          isPending={false}
          onRefresh={() => undefined}
        />
      </RightPanelTabs>
    </div>
  );
}

function panelElement(): HTMLElement {
  const panel = document.querySelector<HTMLElement>("[data-palari-panel]");
  expect(panel).not.toBeNull();
  return panel!;
}

function assertNoNestedCards(root: HTMLElement): void {
  expect(root.querySelector("[data-slot=card] [data-slot=card]")).toBeNull();
}

function assertCompactCardRadii(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-slot=card]"));
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) {
    const radius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius);
    expect(Number.isFinite(radius)).toBe(true);
    expect(radius).toBeLessThanOrEqual(8);
  }
}

function assertNoHorizontalOverflow(root: HTMLElement): void {
  const candidates = [root, ...root.querySelectorAll<HTMLElement>("*")];
  const overflows = candidates.flatMap((element) => {
    if (element instanceof SVGElement || element.clientWidth <= 0) return [];
    const text = element.textContent?.trim() ?? "";
    if (text.length === 0) return [];
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const visuallyHidden =
      element.classList.contains("sr-only") || (bounds.width <= 1 && bounds.height <= 1);
    const intentionallyClipped =
      (style.overflowX === "hidden" || style.overflowX === "clip") &&
      style.textOverflow === "ellipsis";
    if (visuallyHidden || intentionallyClipped || element.scrollWidth <= element.clientWidth + 1) {
      return [];
    }
    return [
      {
        element: element.tagName.toLowerCase(),
        slot: element.dataset.slot ?? null,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        text: text.slice(0, 80),
      },
    ];
  });
  expect(overflows).toEqual([]);
}

function assertReadOnlyControlInventory(root: HTMLElement): void {
  const interactive = Array.from(
    root.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [role="button"]'),
  );
  expect(interactive).toHaveLength(1);
  const refresh = interactive[0]!;
  expect(refresh.tagName).toBe("BUTTON");
  expect(refresh.getAttribute("aria-label")).toBe("Refresh Palari overview");
  const controlName = (
    refresh.getAttribute("aria-label") ??
    refresh.textContent ??
    ""
  ).toLowerCase();
  for (const forbiddenName of FORBIDDEN_CONTROL_NAMES) {
    expect(controlName).not.toMatch(new RegExp(`\\b${forbiddenName}\\b`, "i"));
  }
}

function assertPanelIdentity(root: HTMLElement, connected: boolean): void {
  expect(root.getAttribute("aria-labelledby")).toBe("palari-panel-title");
  expect(root.textContent).toContain("Palari");
  expect(root.textContent).toContain("Company OS");
  expect(root.textContent).toContain("Read only");
  if (connected) expect(root.textContent).toContain("Connected");
  const checkedAt = root.querySelector<HTMLTimeElement>(
    `time[datetime="${PALARI_TEST_CHECKED_AT}"]`,
  );
  expect(checkedAt).not.toBeNull();
}

let consoleErrors: unknown[][] = [];

beforeEach(() => {
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args);
  });
});

afterEach(async () => {
  cleanup();
  document.documentElement.classList.remove("dark");
  await page.viewport(1280, 720);
  const observedErrors = consoleErrors;
  vi.restoreAllMocks();
  expect(observedErrors).toEqual([]);
});

describe("PalariPanelView", () => {
  it("shows the connected read-only identity and attention hierarchy on desktop", async () => {
    await page.viewport(1440, 900);
    const onRefresh = vi.fn();
    await render(<PanelFrame overview={buildReadyAttentionOverview()} onRefresh={onRefresh} />);

    await expect.element(page.getByRole("heading", { name: "Palari" })).toBeVisible();
    expect(page.getByText("Founder decision required").query()).not.toBeNull();
    expect(page.getByRole("heading", { name: "Governed work" }).query()).not.toBeNull();
    await expect.element(page.getByText("Scope & proof").first()).toBeVisible();
    await expect.element(page.getByText("Readiness").first()).toBeVisible();
    for (const label of ["Evidence", "Receipt", "Review", "Acceptance"]) {
      await expect.element(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect.element(page.getByText("Lumen", { exact: true }).first()).toBeVisible();

    const panel = panelElement();
    assertPanelIdentity(panel, true);
    assertReadOnlyControlInventory(panel);
    assertNoNestedCards(panel);
    assertCompactCardRadii(panel);
    assertNoHorizontalOverflow(panel);
    const panelBounds = panel.getBoundingClientRect();
    expect(panelBounds.width).toBeLessThanOrEqual(DESKTOP_PANEL_WIDTH);
    expect(panelBounds.right).toBeLessThanOrEqual(1440);

    const refresh = page.getByRole("button", { name: "Refresh Palari overview" });
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(refresh.element());
    await refresh.hover();
    await expect.element(page.getByText("Refresh Palari overview", { exact: true })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("distinguishes ready work that needs no founder attention", async () => {
    await render(<PanelFrame overview={buildReadyNoAttentionOverview()} />);

    expect(page.getByText("No founder action needed").query()).not.toBeNull();
    await expect.element(page.getByText("Review the fictional receipt bundle")).toBeVisible();
    expect(document.body.textContent).not.toContain("Founder decision required");
    expect(document.body.textContent).not.toContain("Governance attention needed");
    assertPanelIdentity(panelElement(), true);
    assertReadOnlyControlInventory(panelElement());
  });

  it("preserves the Palari hierarchy and contrast tokens in the dark theme", async () => {
    document.documentElement.classList.add("dark");
    await render(<PanelFrame overview={buildReadyAttentionOverview()} />);

    const panel = panelElement();
    const panelStyle = getComputedStyle(panel);
    const mark = panel.querySelector<HTMLElement>("[data-palari-mark]");
    expect(mark).not.toBeNull();
    const markStyle = getComputedStyle(mark!);
    expect(panelStyle.backgroundColor).not.toBe(panelStyle.color);
    expect(markStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(markStyle.color).not.toBe(panelStyle.backgroundColor);
    assertNoHorizontalOverflow(panel);
    assertCompactCardRadii(panel);
    assertReadOnlyControlInventory(panel);
  });

  it("caps the active inline Palari surface at approximately 28rem", async () => {
    await page.viewport(1440, 900);
    await render(<InlinePalariHarness overview={buildReadyAttentionOverview()} />);

    const shell = document.querySelector<HTMLElement>('[data-preview-panel-mode="inline"]');
    expect(shell).not.toBeNull();
    expect(shell!.getBoundingClientRect().width).toBeLessThanOrEqual(DESKTOP_PANEL_WIDTH);
    assertNoHorizontalOverflow(panelElement());
    assertReadOnlyControlInventory(panelElement());
  });

  it("renders the empty workspace and bounded loading states", async () => {
    const screen = await render(<PanelFrame overview={buildEmptyOverview()} />);
    await expect.element(page.getByText("No governed work")).toBeVisible();
    assertPanelIdentity(panelElement(), true);
    assertReadOnlyControlInventory(panelElement());

    await screen.rerender(<PanelFrame overview={null} isPending />);
    const loadingPanel = panelElement();
    expect(loadingPanel.getAttribute("aria-busy")).toBe("true");
    await expect
      .element(page.getByText("Loading Palari governance overview", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(page.getByLabelText("Loading Palari governance overview"))
      .toBeInTheDocument();
    expect(
      (page.getByRole("button", { name: "Refresh Palari overview" }).element() as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    assertReadOnlyControlInventory(loadingPanel);
    assertNoHorizontalOverflow(loadingPanel);
  });

  it("renders disabled, unavailable, incompatible, and invalid states explicitly", async () => {
    const screen = await render(<PanelFrame overview={buildOperationalOverview("disabled")} />);

    for (const status of ["disabled", "unavailable", "incompatible", "invalid"] as const) {
      if (status !== "disabled") {
        await screen.rerender(<PanelFrame overview={buildOperationalOverview(status)} />);
      }
      const panel = panelElement();
      expect(panel.textContent?.toLowerCase()).toContain(status);
      expect(panel.textContent).toContain(buildOperationalOverview(status).message);
      if (status === "disabled") {
        expect(page.getByRole("alert").query()).toBeNull();
      } else {
        expect(page.getByRole("alert").query()).not.toBeNull();
      }
      assertPanelIdentity(panel, false);
      assertReadOnlyControlInventory(panel);
      assertNoHorizontalOverflow(panel);
    }
  });

  it("keeps cached ready data visible when refresh fails or remains in flight", async () => {
    const cached = buildReadyAttentionOverview();
    const screen = await render(
      <PanelFrame overview={cached} error="A redacted refresh failure occurred." />,
    );
    await expect.element(page.getByText("Refresh failed", { exact: true })).toBeVisible();
    await expect.element(page.getByText(cached.workspace.name)).toBeVisible();
    await expect.element(page.getByText(cached.workItems[0]!.title)).toBeVisible();
    expect(panelElement().querySelector(`time[datetime="${cached.checkedAt}"]`)).not.toBeNull();

    await screen.rerender(<PanelFrame overview={cached} isPending />);
    await expect
      .element(page.getByText("Refreshing Palari governance overview", { exact: true }))
      .toBeInTheDocument();
    await expect.element(page.getByText(cached.workspace.name)).toBeVisible();
    expect(
      (page.getByRole("button", { name: "Refresh Palari overview" }).element() as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("wraps exact protocol-bound text without horizontal overflow", async () => {
    expect(PALARI_MAX_SHORT_TEXT).toHaveLength(256);
    expect(PALARI_MAX_LONG_TEXT).toHaveLength(512);
    await page.viewport(390, 844);
    await render(
      <PanelFrame overview={buildMaxTextOverview()} width={MOBILE_PANEL_MAX_WIDTH} height={760} />,
    );

    await expect
      .element(page.getByText(PALARI_MAX_SHORT_TEXT, { exact: true }).first())
      .toBeVisible();
    await expect
      .element(page.getByText(PALARI_MAX_LONG_TEXT, { exact: true }).first())
      .toBeVisible();
    const panel = panelElement();
    assertNoHorizontalOverflow(panel);
    assertCompactCardRadii(panel);
    assertReadOnlyControlInventory(panel);
  });

  it("renders the 50-item browser boundary with unique, reachable rows", async () => {
    const overview = buildMaxItemsOverview();
    expect(overview.workItems).toHaveLength(50);
    expect(new Set(overview.workItems.map((item) => item.id)).size).toBe(50);
    await render(<PanelFrame overview={overview} />);

    const items = Array.from(
      panelElement().querySelectorAll<HTMLElement>("[data-palari-work-item]"),
    );
    expect(items).toHaveLength(50);
    expect(new Set(items.map((item) => item.dataset.palariWorkItem)).size).toBe(50);
    await expect.element(page.getByText("Bounded view")).toBeVisible();

    const lastItem = panelElement().querySelector<HTMLElement>(
      '[data-palari-work-item="WORK-FIXTURE-50"]',
    );
    expect(lastItem).not.toBeNull();
    lastItem!.scrollIntoView({ block: "nearest" });
    await expect.element(page.getByText("Fictional governed work item 50")).toBeVisible();
    assertNoHorizontalOverflow(panelElement());
    assertReadOnlyControlInventory(panelElement());
  });

  it("keeps the mobile sheet bounded, traps focus, closes on Escape, and restores focus", async () => {
    await page.viewport(MOBILE_VIEWPORT_WIDTH, 844);
    await render(<MobileHarness overview={buildReadyAttentionOverview()} />);

    const trigger = page.getByRole("button", { name: "Open Palari" });
    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("heading", { name: "Palari" })).toBeVisible();

    const popup = document.querySelector<HTMLElement>("[data-slot=sheet-popup]");
    expect(popup).not.toBeNull();
    const popupBounds = popup!.getBoundingClientRect();
    expect(popupBounds.width).toBeLessThanOrEqual(MOBILE_PANEL_MAX_WIDTH + 1);
    expect(popupBounds.left).toBeGreaterThanOrEqual(0);
    expect(popupBounds.right).toBeLessThanOrEqual(MOBILE_VIEWPORT_WIDTH);
    expect(popup!.contains(document.activeElement)).toBe(true);
    assertNoHorizontalOverflow(popup!);
    assertCompactCardRadii(panelElement());
    assertReadOnlyControlInventory(panelElement());

    await userEvent.keyboard("{Tab}");
    expect(popup!.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(document.querySelector("[data-palari-panel]")).toBeNull();
      expect(document.activeElement).toBe(trigger.element());
    });
  });

  it("opens the surface menu and selects Palari with the keyboard", async () => {
    const onAddPalari = vi.fn();
    await render(
      <div style={{ width: DESKTOP_PANEL_WIDTH, height: 640 }}>
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
