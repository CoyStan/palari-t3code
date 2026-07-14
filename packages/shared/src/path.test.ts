import { describe, expect, it } from "vite-plus/test";
import {
  isExplicitRelativePath,
  isRelativePathWithinRoot,
  isUncPath,
  isWindowsAbsolutePath,
  isWindowsDrivePath,
} from "./path.ts";

describe("path helpers", () => {
  it("detects windows drive paths", () => {
    expect(isWindowsDrivePath("C:\\repo")).toBe(true);
    expect(isWindowsDrivePath("D:/repo")).toBe(true);
    expect(isWindowsDrivePath("/repo")).toBe(false);
  });

  it("detects UNC paths", () => {
    expect(isUncPath("\\\\server\\share\\repo")).toBe(true);
    expect(isUncPath("C:\\repo")).toBe(false);
  });

  it("detects windows absolute paths", () => {
    expect(isWindowsAbsolutePath("C:\\repo")).toBe(true);
    expect(isWindowsAbsolutePath("\\\\server\\share\\repo")).toBe(true);
    expect(isWindowsAbsolutePath("./repo")).toBe(false);
  });

  it("detects explicit relative paths", () => {
    expect(isExplicitRelativePath(".")).toBe(true);
    expect(isExplicitRelativePath("..")).toBe(true);
    expect(isExplicitRelativePath("./repo")).toBe(true);
    expect(isExplicitRelativePath("..\\repo")).toBe(true);
    expect(isExplicitRelativePath("~/repo")).toBe(false);
  });

  it("checks canonical relative paths without sibling-prefix confusion", () => {
    const isAbsolute = (value: string) => value.startsWith("/") || /^[a-z]:\\/i.test(value);

    expect(isRelativePathWithinRoot("", isAbsolute)).toBe(true);
    expect(isRelativePathWithinRoot("workspace.json", isAbsolute)).toBe(true);
    expect(isRelativePathWithinRoot("split/work-items.json", isAbsolute)).toBe(true);
    expect(isRelativePathWithinRoot("..", isAbsolute)).toBe(false);
    expect(isRelativePathWithinRoot("../workspace-sibling", isAbsolute)).toBe(false);
    expect(isRelativePathWithinRoot("..\\workspace-sibling", isAbsolute)).toBe(false);
    expect(isRelativePathWithinRoot("/absolute", isAbsolute)).toBe(false);
    expect(isRelativePathWithinRoot("C:\\absolute", isAbsolute)).toBe(false);
  });
});
