import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import { type EnvironmentId, ThreadId } from "@t3tools/contracts";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const CURRENT_STORAGE_KEY = "t3code:right-panel-state:v2";
const CURRENT_STORAGE_VERSION = 8;

function createLocalStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("rightPanelStore current-version hydration", () => {
  it("validates current-version snapshots and preserves live store actions", async () => {
    const localStorage = createLocalStorageStub();
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("localStorage", localStorage);
    localStorage.setItem(
      CURRENT_STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_STORAGE_VERSION,
        state: {
          byThreadKey: {
            "env-1:thread-A": {
              isOpen: true,
              activeSurfaceId: "palari",
              surfaces: [
                { id: "palari", kind: "palari", injected: "discard me" },
                { id: "plan", kind: "plan" },
                { id: "diff", kind: "unknown" },
                { id: "terminal:wrong", kind: "terminal", resourceId: "term-1" },
              ],
            },
          },
          open: "corrupt persisted action",
        },
      }),
    );

    const {
      RIGHT_PANEL_STORAGE_KEY,
      RIGHT_PANEL_STORAGE_VERSION,
      selectThreadRightPanelState,
      useRightPanelStore,
    } = await import("./rightPanelStore");
    await useRightPanelStore.persist.rehydrate();

    expect(RIGHT_PANEL_STORAGE_KEY).toBe(CURRENT_STORAGE_KEY);
    expect(RIGHT_PANEL_STORAGE_VERSION).toBe(CURRENT_STORAGE_VERSION);
    expect(typeof useRightPanelStore.getState().open).toBe("function");

    const ref = scopeThreadRef("env-1" as EnvironmentId, ThreadId.make("thread-A"));
    expect(selectThreadRightPanelState(useRightPanelStore.getState().byThreadKey, ref)).toEqual({
      isOpen: true,
      activeSurfaceId: "palari",
      surfaces: [
        { id: "palari", kind: "palari" },
        { id: "plan", kind: "plan" },
      ],
    });

    useRightPanelStore.getState().open(ref, "diff");
    expect(
      selectThreadRightPanelState(useRightPanelStore.getState().byThreadKey, ref).surfaces,
    ).toContainEqual({ id: "diff", kind: "diff" });
  });
});
