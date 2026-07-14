import type {
  PalariOperationalStatus,
  PalariReadOverviewResult,
  PalariReadyOverview,
  PalariScopeSummary,
  PalariWorkItemOverview,
} from "@t3tools/contracts";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  CircleOff,
  FileCheck2,
  FileLock2,
  Layers3,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

import {
  formatPalariApproval,
  formatPalariLabel,
  orderPalariWorkItems,
  palariAcceptanceTone,
  palariApprovalTone,
  palariAttentionTone,
  palariBoundaryTone,
  palariEvidenceTone,
  palariReceiptTone,
  palariReviewTone,
  palariRiskTone,
} from "./palariPanelViewState";

export interface PalariPanelViewProps {
  readonly overview: PalariReadOverviewResult | null;
  readonly error: string | null;
  readonly isPending: boolean;
  readonly onRefresh: () => void;
}

type ConnectionPresentation = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: string;
  readonly state: string;
};

function connectionPresentation(
  overview: PalariReadOverviewResult | null,
  isPending: boolean,
): ConnectionPresentation {
  if (!overview) {
    return isPending
      ? {
          icon: RefreshCw,
          label: "Checking Company OS",
          tone: "text-info-foreground",
          state: "checking",
        }
      : {
          icon: AlertCircle,
          label: "Company OS unavailable",
          tone: "text-warning-foreground",
          state: "unavailable",
        };
  }
  switch (overview.status) {
    case "ready":
      return {
        icon: ShieldCheck,
        label: "Company OS · Connected",
        tone: "text-success-foreground",
        state: "connected",
      };
    case "disabled":
      return {
        icon: CircleOff,
        label: "Company OS · Disabled",
        tone: "text-muted-foreground",
        state: "disabled",
      };
    case "unavailable":
      return {
        icon: AlertCircle,
        label: "Company OS · Unavailable",
        tone: "text-warning-foreground",
        state: "unavailable",
      };
    case "incompatible":
      return {
        icon: TriangleAlert,
        label: "Company OS · Incompatible",
        tone: "text-destructive-foreground",
        state: "incompatible",
      };
    case "invalid":
      return {
        icon: TriangleAlert,
        label: "Company OS · Invalid workspace",
        tone: "text-destructive-foreground",
        state: "invalid",
      };
  }
}

function CheckedAt({ value }: { readonly value: string | undefined }) {
  if (!value) return <span>Not checked yet</span>;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return <span>Last checked unknown</span>;
  return (
    <time dateTime={value} title={date.toLocaleString()}>
      Last checked {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

function PanelHeader(
  props: Pick<PalariPanelViewProps, "isPending" | "onRefresh"> & {
    readonly overview: PalariReadOverviewResult | null;
  },
) {
  const connection = connectionPresentation(props.overview, props.isPending);
  const ConnectionIcon = connection.icon;
  const refreshButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={props.isPending}
      onClick={props.onRefresh}
      aria-label="Refresh Palari overview"
    >
      {props.isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <RefreshCw data-icon="inline-start" />
      )}
    </Button>
  );
  return (
    <>
      <header className="flex shrink-0 items-start gap-2.5 px-3 py-2.5">
        <div
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-palari/12 font-semibold text-palari-foreground text-sm"
          data-palari-mark
        >
          P
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 id="palari-panel-title" className="font-semibold text-sm">
              Palari
            </h2>
            <Badge variant="outline" size="sm">
              Read only
            </Badge>
          </div>
          <div
            className={cn("mt-0.5 flex min-w-0 items-center gap-1.5 text-xs", connection.tone)}
            data-palari-connection={connection.state}
          >
            <ConnectionIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 break-words">{connection.label}</span>
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs">
            <CheckedAt value={props.overview?.checkedAt} />
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger render={refreshButton} />
          <TooltipPopup side="bottom">Refresh Palari overview</TooltipPopup>
        </Tooltip>
      </header>
      <Separator />
    </>
  );
}

function LoadingOverview() {
  return (
    <div className="flex flex-col gap-3 p-3" aria-label="Loading Palari governance overview">
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-28 w-full rounded-md" />
      <div className="flex items-center gap-2 px-1">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-52 w-full rounded-md" />
    </div>
  );
}

const OPERATIONAL_TITLES: Record<PalariOperationalStatus["status"], string> = {
  disabled: "Palari is disabled",
  unavailable: "Company OS unavailable",
  incompatible: "Company OS incompatible",
  invalid: "Company OS workspace invalid",
};

function OperationalState({ overview }: { readonly overview: PalariOperationalStatus }) {
  if (overview.status === "disabled") {
    return (
      <Empty className="min-h-64">
        <EmptyMedia variant="icon">
          <CircleOff aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-base">{OPERATIONAL_TITLES.disabled}</EmptyTitle>
          <EmptyDescription className="break-words">{overview.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div className="p-3">
      <Alert variant={overview.status === "unavailable" ? "warning" : "error"}>
        {overview.status === "unavailable" ? <AlertCircle /> : <TriangleAlert />}
        <AlertTitle>{OPERATIONAL_TITLES[overview.status]}</AlertTitle>
        <AlertDescription>
          <p className="break-words">{overview.message}</p>
          <p className="break-words text-xs">Reference: {overview.code}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

const SUMMARY_CELLS = [
  ["Attention", "needsAttention"],
  ["Human", "waitingOnHuman"],
  ["Active", "active"],
  ["Review ready", "reviewReady"],
] as const;

function AttentionRail({ overview }: { readonly overview: PalariReadyOverview }) {
  if (overview.summary.waitingOnHuman > 0) {
    return (
      <Alert variant="warning" data-palari-attention="human">
        <UserRoundCheck />
        <AlertTitle>Founder decision required</AlertTitle>
        <AlertDescription>
          {overview.summary.waitingOnHuman} governed work{" "}
          {overview.summary.waitingOnHuman === 1 ? "item is" : "items are"} waiting for human
          authority.
        </AlertDescription>
      </Alert>
    );
  }
  if (overview.summary.needsAttention > 0) {
    return (
      <Alert variant="info" data-palari-attention="governance">
        <TriangleAlert />
        <AlertTitle>Governance attention needed</AlertTitle>
        <AlertDescription>
          {overview.summary.needsAttention} governed work{" "}
          {overview.summary.needsAttention === 1 ? "item needs" : "items need"} review.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div
      className="flex items-center gap-2 rounded-md bg-success/4 px-2.5 py-2 text-success-foreground text-xs"
      data-palari-attention="clear"
    >
      <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
      <span className="font-medium">No founder action needed</span>
    </div>
  );
}

function WorkspaceSummary({ overview }: { readonly overview: PalariReadyOverview }) {
  return (
    <Card className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]">
      <CardHeader className="gap-0.5 p-3 pb-2.5">
        <CardTitle render={<h3 />} className="break-words text-sm leading-snug">
          {overview.workspace.name}
        </CardTitle>
        <CardDescription className="break-words text-xs">
          {overview.summary.total} governed work {overview.summary.total === 1 ? "item" : "items"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {SUMMARY_CELLS.map(([label, key]) => (
            <div key={key} className="min-w-0">
              <dt className="break-words text-muted-foreground text-[0.6875rem]">{label}</dt>
              <dd className="font-semibold text-sm tabular-nums">{overview.summary[key]}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function ReadinessRow(props: {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  readonly tone: ReturnType<typeof palariEvidenceTone>;
}) {
  const Icon = props.icon;
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{props.label}</span>
      </dt>
      <dd className="min-w-0">
        <Badge variant={props.tone} size="sm" className="max-w-full">
          <span className="truncate">{props.value}</span>
        </Badge>
      </dd>
    </div>
  );
}

function Readiness({ item }: { readonly item: PalariWorkItemOverview }) {
  const readinessId = item.id + "-readiness";
  return (
    <section aria-labelledby={readinessId} className="flex flex-col gap-2">
      <h5 id={readinessId} className="font-medium text-xs">
        Readiness
      </h5>
      <dl className="grid grid-cols-1 gap-2 min-[760px]:grid-cols-2">
        <ReadinessRow
          icon={FileCheck2}
          label="Evidence"
          value={formatPalariLabel(item.readiness.evidence)}
          tone={palariEvidenceTone(item.readiness.evidence)}
        />
        <ReadinessRow
          icon={ReceiptText}
          label="Receipt"
          value={formatPalariLabel(item.readiness.receipt)}
          tone={palariReceiptTone(item.readiness.receipt)}
        />
        <ReadinessRow
          icon={MessageSquareText}
          label="Review"
          value={formatPalariLabel(item.readiness.review)}
          tone={palariReviewTone(item.readiness.review)}
        />
        <ReadinessRow
          icon={BadgeCheck}
          label="Acceptance"
          value={formatPalariLabel(item.readiness.acceptance)}
          tone={palariAcceptanceTone(item.readiness.acceptance)}
        />
        <ReadinessRow
          icon={UserRoundCheck}
          label="Approval"
          value={formatPalariApproval(item.readiness.approval)}
          tone={palariApprovalTone(item.readiness.approval)}
        />
      </dl>
    </section>
  );
}

function requirementSummary(scope: PalariScopeSummary): string {
  const requirements = [
    scope.requiresEvidence ? "evidence" : null,
    scope.requiresReview ? "review" : null,
    scope.requiresReceipt ? "receipt" : null,
    scope.requiresHumanDecision ? "human decision" : null,
  ].filter((value): value is string => value !== null);
  return requirements.length > 0
    ? "Completion requires " + requirements.join(", ") + "."
    : "No additional completion proof is required.";
}

function ScopeAndProof(props: {
  readonly item: PalariWorkItemOverview;
  readonly scope: PalariScopeSummary;
}) {
  const { item, scope } = props;
  const scopeId = item.id + "-scope";
  return (
    <section aria-labelledby={scopeId} className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h5 id={scopeId} className="flex min-w-0 items-center gap-1.5 font-medium text-xs">
          <FileLock2 aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          Scope &amp; proof
        </h5>
        <Badge variant={palariBoundaryTone(item.readiness.boundary)} size="sm">
          {formatPalariLabel(item.readiness.boundary)}
        </Badge>
      </div>
      <p className="break-words text-muted-foreground text-xs [overflow-wrap:anywhere]">
        {scope.objective}
      </p>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
        {[
          ["Sources", scope.sourceCount],
          ["Read", scope.readPathCount],
          ["Write", scope.writePathCount],
          ["Outputs", scope.requiredOutputCount],
          ["Prohibited", scope.forbiddenActionCount],
        ].map(([label, count]) => (
          <div key={label} className="min-w-0">
            <dt className="break-words text-muted-foreground text-[0.6875rem]">{label}</dt>
            <dd className="font-medium tabular-nums">{count}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={scope.externalWritesAllowed ? "warning" : "success"} size="sm">
          {scope.externalWritesAllowed ? "External writes allowed" : "External writes blocked"}
        </Badge>
      </div>
      <p className="break-words text-muted-foreground text-xs">{requirementSummary(scope)}</p>
    </section>
  );
}

function WorkItem(props: {
  readonly item: PalariWorkItemOverview;
  readonly scope: PalariScopeSummary | null;
}) {
  const { item, scope } = props;
  const titleId = item.id + "-title";
  return (
    <Card
      render={<article aria-labelledby={titleId} />}
      className="rounded-md before:rounded-[calc(var(--radius-md)-1px)] [contain-intrinsic-size:auto_20rem] [content-visibility:auto]"
      data-palari-work-item={item.id}
    >
      <CardHeader className="gap-2 p-3 pb-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant={palariAttentionTone(item.attention)} size="sm">
            {formatPalariLabel(item.attention)}
          </Badge>
          <Badge variant={palariRiskTone(item.risk)} size="sm">
            Risk {item.risk}
          </Badge>
        </div>
        <CardTitle
          render={<h4 id={titleId} />}
          className="break-words text-sm leading-snug [overflow-wrap:anywhere]"
        >
          {item.title}
        </CardTitle>
        <CardDescription className="break-words text-xs [overflow-wrap:anywhere]">
          {item.why}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-3 pb-3">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <UserRoundCheck aria-hidden="true" className="size-3.5 shrink-0" />
            Assigned Palari
          </dt>
          <dd className="min-w-0 break-words text-right [overflow-wrap:anywhere]">
            {item.assignedPalari.name}
          </dd>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Layers3 aria-hidden="true" className="size-3.5 shrink-0" />
            Workbench
          </dt>
          <dd className="min-w-0 break-words text-right [overflow-wrap:anywhere]">
            {item.workbenchLabel}
          </dd>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
            Next step
          </dt>
          <dd className="min-w-0 break-words text-right [overflow-wrap:anywhere]">
            {formatPalariLabel(item.nextStepType)}
          </dd>
        </dl>
        {scope ? (
          <>
            <Separator />
            <ScopeAndProof item={item} scope={scope} />
          </>
        ) : null}
        <Separator />
        <Readiness item={item} />
        {item.waitingOnHuman ? (
          <Alert variant="warning">
            <UserRoundCheck />
            <AlertTitle>Human decision required</AlertTitle>
            <AlertDescription>T3 can observe this state but cannot decide it.</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReadyOverview({ overview }: { readonly overview: PalariReadyOverview }) {
  const workItems = orderPalariWorkItems(overview.workItems);
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex min-w-0 flex-col gap-3 p-3">
        <AttentionRail overview={overview} />
        <WorkspaceSummary overview={overview} />
        {workItems.length === 0 ? (
          <Empty className="min-h-56 py-8">
            <EmptyMedia variant="icon">
              <CircleCheck aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No governed work</EmptyTitle>
              <EmptyDescription>
                The configured workspace has no open governance work.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <section aria-labelledby="palari-governed-work" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
              <h3 id="palari-governed-work" className="font-medium text-sm">
                Governed work
              </h3>
              <Badge variant="secondary" size="sm">
                {workItems.length}
              </Badge>
            </div>
            {workItems.map((item) => (
              <WorkItem
                key={item.id}
                item={item}
                scope={overview.scopeSummary?.workItemId === item.id ? overview.scopeSummary : null}
              />
            ))}
          </section>
        )}
        {overview.itemsTruncated || overview.contentTruncated ? (
          <Alert variant="info">
            <AlertCircle />
            <AlertTitle>Bounded view</AlertTitle>
            <AlertDescription>
              Some records or text were shortened for this compact panel.
            </AlertDescription>
          </Alert>
        ) : null}
        <p className="px-0.5 pb-1 text-muted-foreground text-xs">
          Company OS {overview.companyOs.version} · revision{" "}
          {overview.companyOs.revision.slice(0, 8)}
        </p>
      </div>
    </ScrollArea>
  );
}

function liveStatusMessage(props: PalariPanelViewProps): string {
  if (props.isPending) {
    return props.overview
      ? "Refreshing Palari governance overview"
      : "Loading Palari governance overview";
  }
  if (props.error && props.overview) {
    return "Palari refresh failed; showing the last available governance overview";
  }
  if (!props.overview) return "Palari governance overview is unavailable";
  if (props.overview.status !== "ready") {
    return "Palari governance status is " + props.overview.status;
  }
  return "Palari governance overview is current";
}

export function PalariPanelView(props: PalariPanelViewProps) {
  const overview = props.overview;
  return (
    <TooltipProvider delay={250}>
      <section
        aria-labelledby="palari-panel-title"
        aria-busy={props.isPending}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
        data-palari-panel
      >
        <PanelHeader overview={overview} isPending={props.isPending} onRefresh={props.onRefresh} />
        <div className="sr-only" role="status" aria-live="polite">
          {liveStatusMessage(props)}
        </div>
        {props.error && overview ? (
          <div className="px-3 pt-3">
            <Alert variant="warning">
              <AlertCircle />
              <AlertTitle>Refresh failed</AlertTitle>
              <AlertDescription>Showing the last available governance overview.</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {!overview && props.isPending ? <LoadingOverview /> : null}
        {!overview && !props.isPending ? (
          <div className="p-3">
            <Alert variant="error">
              <AlertCircle />
              <AlertTitle>Overview unavailable</AlertTitle>
              <AlertDescription>
                {props.error ?? "The environment request failed."}
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        {overview?.status === "ready" ? <ReadyOverview overview={overview} /> : null}
        {overview && overview.status !== "ready" ? <OperationalState overview={overview} /> : null}
      </section>
    </TooltipProvider>
  );
}
