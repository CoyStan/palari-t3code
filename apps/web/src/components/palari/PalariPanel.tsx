import { PALARI_READ_OVERVIEW_INPUT } from "@t3tools/client-runtime/state/palari";
import type { EnvironmentId } from "@t3tools/contracts";

import { palariEnvironment } from "~/state/palari";
import { useEnvironmentQuery } from "~/state/query";

import { PalariPanelView } from "./PalariPanelView";

export function PalariPanel({ environmentId }: { readonly environmentId: EnvironmentId }) {
  const overview = useEnvironmentQuery(
    palariEnvironment.overview({ environmentId, input: PALARI_READ_OVERVIEW_INPUT }),
  );
  return (
    <PalariPanelView
      overview={overview.data}
      error={overview.error}
      isPending={overview.isPending}
      onRefresh={overview.refresh}
    />
  );
}

export default PalariPanel;
