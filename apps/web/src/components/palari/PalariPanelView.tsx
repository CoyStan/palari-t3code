import type {
  PalariOperationalStatus,
  PalariReadOverviewResult,
  PalariReadyOverview,
  PalariWorkItemOverview,
} from "@t3tools/contracts";
import {
  AlertCircle,
  ClipboardCheck,
  FileLock2,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";

import { formatPalariLabel, orderPalariWorkItems, palariStateTone } from "./palariPanelViewState";

export interface PalariPanelViewProps {
  readonly overview: PalariReadOverviewResult | null;
  readonly error: string | null;
  readonly isPending: boolean;
  readonly onRefresh: () => void;
}

function CheckedAt({ value }: { readonly value: string }) {
  const date = new Date(value);
  const display = Number.isNaN(date.valueOf()) ? "Unknown" : date.toLocaleString();
  return <time dateTime={value}>{display}</time>;
}

function PanelHeader(
  props: Pick<PalariPanelViewProps, "isPending" | "onRefresh"> & {
    readonly checkedAt?: string;
  },
) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="palari-panel-title" className="font-semibold text-sm">
            Palari Company OS
          </h2>
          <Badge variant="outline" size="sm">
            Read only
          </Badge>
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          {props.checkedAt ? (
            <>
              Checked <CheckedAt value={props.checkedAt} />
            </>
          ) : (
            "Governance view"
          )}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={props.isPending}
        onClick={props.onRefresh}
        aria-label="Refresh Palari governance overview"
      >
        {props.isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <RefreshCw data-icon="inline-start" />
        )}
        Refresh
      </Button>
    </header>
  );
}

function LoadingOverview() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-label="Loading Palari governance overview">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}

function OperationalState({ overview }: { readonly overview: PalariOperationalStatus }) {
  const variant = overview.status === "unavailable" ? "warning" : "error";
  return (
    <div className="p-4">
      <Alert variant={variant}>
        <AlertCircle />
        <AlertTitle>{formatPalariLabel(overview.status)}</AlertTitle>
        <AlertDescription>
          <p className="break-words">{overview.message}</p>
          <p className="text-xs">Status code: {overview.code}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

const SUMMARY_CELLS = [
  ["Needs attention", "needsAttention"],
  ["Waiting on human", "waitingOnHuman"],
  ["Active", "active"],
  ["Review ready", "reviewReady"],
] as const;

function Summary({ overview }: { readonly overview: PalariReadyOverview }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">{overview.workspace.name}</CardTitle>
        <CardDescription className="break-words text-xs">
          {overview.summary.total} bounded work {overview.summary.total === 1 ? "item" : "items"}
        </CardDescription>
        <CardAction>
          <Badge variant={overview.summary.waitingOnHuman > 0 ? "warning" : "success"}>
            {overview.summary.waitingOnHuman > 0 ? "Decision needed" : "Observed"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <dl className="grid grid-cols-2 gap-2">
          {SUMMARY_CELLS.map(([label, key]) => (
            <div key={key} className="min-w-0 rounded-lg bg-muted/50 p-3">
              <dt className="break-words text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-1 font-semibold text-lg tabular-nums">{overview.summary[key]}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

const READINESS_FIELDS = [
  "evidence",
  "review",
  "receipt",
  "acceptance",
  "approval",
  "boundary",
] as const;

function WorkItem({ item }: { readonly item: PalariWorkItemOverview }) {
  return (
    <Card data-palari-work-item={item.id}>
      <CardHeader className="p-4 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant={palariStateTone(item.attention)}>
            {formatPalariLabel(item.attention)}
          </Badge>
          <Badge variant="outline">{item.risk}</Badge>
        </div>
        <CardTitle className="break-words text-sm leading-snug">{item.title}</CardTitle>
        <CardDescription className="break-words text-xs">{item.why}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Palari</dt>
          <dd className="min-w-0 break-words text-right">{item.assignedPalari.name}</dd>
          <dt className="text-muted-foreground">Workbench</dt>
          <dd className="min-w-0 break-words text-right">{item.workbenchLabel}</dd>
          <dt className="text-muted-foreground">Next step</dt>
          <dd className="min-w-0 break-words text-right">{formatPalariLabel(item.nextStepType)}</dd>
        </dl>
        {item.waitingOnHuman ? (
          <Alert variant="warning">
            <UserRoundCheck />
            <AlertTitle>Human decision required</AlertTitle>
          </Alert>
        ) : null}
        <div>
          <h4 className="mb-2 font-medium text-xs">Readiness</h4>
          <dl className="flex flex-wrap gap-1.5">
            {READINESS_FIELDS.map((field) => (
              <div key={field} className="min-w-0">
                <dt className="sr-only">{formatPalariLabel(field)}</dt>
                <dd>
                  <Badge variant={palariStateTone(item.readiness[field])} className="max-w-full">
                    <span className="truncate">
                      {formatPalariLabel(field)}: {formatPalariLabel(item.readiness[field])}
                    </span>
                  </Badge>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function ScopeSummary({ overview }: { readonly overview: PalariReadyOverview }) {
  const scope = overview.scopeSummary;
  if (!scope) return null;
  const counts = [
    ["Sources", scope.sourceCount],
    ["Read paths", scope.readPathCount],
    ["Write paths", scope.writePathCount],
    ["Required outputs", scope.requiredOutputCount],
    ["Forbidden actions", scope.forbiddenActionCount],
  ] as const;
  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileLock2 />
          Approved boundary
        </CardTitle>
        <CardDescription className="break-words text-xs">{scope.objective}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {counts.map(([label, count]) => (
            <div key={label} className="min-w-0 rounded-lg bg-muted/50 p-2.5">
              <dt className="break-words text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scope.requiresEvidence ? <Badge variant="info">Evidence required</Badge> : null}
          {scope.requiresReview ? <Badge variant="info">Review required</Badge> : null}
          {scope.requiresReceipt ? <Badge variant="info">Receipt required</Badge> : null}
          {scope.requiresHumanDecision ? <Badge variant="warning">Human decision</Badge> : null}
          <Badge variant={scope.externalWritesAllowed ? "warning" : "success"}>
            {scope.externalWritesAllowed ? "External writes allowed" : "External writes blocked"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadyOverview({ overview }: { readonly overview: PalariReadyOverview }) {
  const workItems = orderPalariWorkItems(overview.workItems);
  if (workItems.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Summary overview={overview} />
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardCheck />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No current work items</EmptyTitle>
            <EmptyDescription>
              The configured workspace has no open governance work.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <Summary overview={overview} />
        <ScopeSummary overview={overview} />
        <div className="flex items-center gap-2 px-1 pt-1">
          <ShieldCheck className="text-muted-foreground" />
          <h3 className="font-medium text-sm">Current work</h3>
        </div>
        {workItems.map((item) => (
          <WorkItem key={item.id} item={item} />
        ))}
        {overview.itemsTruncated || overview.contentTruncated ? (
          <Alert variant="info">
            <AlertCircle />
            <AlertTitle>Bounded view</AlertTitle>
            <AlertDescription>
              Some records or text were shortened for this compact panel.
            </AlertDescription>
          </Alert>
        ) : null}
        <p className="px-1 pb-2 text-muted-foreground text-xs">
          Company OS {overview.companyOs.version} · revision{" "}
          {overview.companyOs.revision.slice(0, 8)}
        </p>
      </div>
    </ScrollArea>
  );
}

export function PalariPanelView(props: PalariPanelViewProps) {
  const overview = props.overview;
  return (
    <section
      aria-labelledby="palari-panel-title"
      aria-busy={props.isPending}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
      data-palari-panel
    >
      <PanelHeader
        isPending={props.isPending}
        onRefresh={props.onRefresh}
        {...(overview ? { checkedAt: overview.checkedAt } : {})}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {props.isPending ? "Refreshing Palari governance overview" : "Palari overview is current"}
      </div>
      {props.error && overview ? (
        <div className="px-4 pt-4">
          <Alert variant="warning">
            <AlertCircle />
            <AlertTitle>Refresh failed</AlertTitle>
            <AlertDescription>Showing the last available governance overview.</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {!overview && props.isPending ? <LoadingOverview /> : null}
      {!overview && !props.isPending ? (
        <div className="p-4">
          <Alert variant="error">
            <AlertCircle />
            <AlertTitle>Overview unavailable</AlertTitle>
            <AlertDescription>{props.error ?? "The environment request failed."}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {overview?.status === "ready" ? <ReadyOverview overview={overview} /> : null}
      {overview && overview.status !== "ready" ? <OperationalState overview={overview} /> : null}
    </section>
  );
}
