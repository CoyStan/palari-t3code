import type { PalariReadyOverview, PalariWorkItemOverview } from "@t3tools/contracts";

const ATTENTION_PRIORITY = new Map<string, number>([
  ["needs-human-decision", 0],
  ["changes-requested", 1],
  ["blocked", 2],
  ["needs-review", 3],
  ["needs-evidence", 4],
  ["receipt-ready", 5],
  ["ready-to-integrate", 6],
  ["ready-for-ai-work", 7],
]);

function attentionPriority(item: PalariWorkItemOverview): number {
  if (item.waitingOnHuman) return -1;
  return ATTENTION_PRIORITY.get(item.attention) ?? 100;
}

export function orderPalariWorkItems(
  items: PalariReadyOverview["workItems"],
): ReadonlyArray<PalariWorkItemOverview> {
  return [...items].sort((left, right) => {
    const priorityDelta = attentionPriority(left) - attentionPriority(right);
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title);
  });
}

export function formatPalariLabel(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type PalariBadgeTone =
  | "default"
  | "destructive"
  | "error"
  | "info"
  | "outline"
  | "secondary"
  | "success"
  | "warning";

export function palariStateTone(value: string): PalariBadgeTone {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("fail") ||
    normalized.includes("block") ||
    normalized.includes("change") ||
    normalized.includes("invalid")
  ) {
    return "error";
  }
  if (
    normalized.includes("human") ||
    normalized.includes("missing") ||
    normalized.includes("required") ||
    normalized.includes("pending")
  ) {
    return "warning";
  }
  if (
    normalized.includes("ready") ||
    normalized.includes("pass") ||
    normalized.includes("complete") ||
    normalized.includes("accepted")
  ) {
    return "success";
  }
  return "secondary";
}
