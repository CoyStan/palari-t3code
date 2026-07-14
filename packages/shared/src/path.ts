export function isWindowsDrivePath(value: string): boolean {
  return /^[a-zA-Z]:([/\\]|$)/.test(value);
}

export function isUncPath(value: string): boolean {
  return value.startsWith("\\\\");
}

export function isWindowsAbsolutePath(value: string): boolean {
  return isUncPath(value) || isWindowsDrivePath(value);
}

export function isExplicitRelativePath(value: string): boolean {
  return (
    value === "." ||
    value === ".." ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith(".\\") ||
    value.startsWith("..\\")
  );
}

/**
 * Decide whether a value returned by a platform path implementation's
 * `relative(root, candidate)` remains inside that root. Callers that need
 * symlink safety must realpath both values before calculating `relative`.
 */
export function isRelativePathWithinRoot(
  relativePath: string,
  isAbsolute: (value: string) => boolean,
): boolean {
  if (relativePath === "") return true;
  if (isAbsolute(relativePath)) return false;

  const normalized = relativePath.replaceAll("\\", "/");
  return normalized !== ".." && !normalized.startsWith("../");
}
