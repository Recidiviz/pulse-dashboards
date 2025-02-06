// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { observer } from "mobx-react-lite";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerOutcomesPresenter } from "../../InsightsStore/presenters/SupervisionOfficerOutcomesPresenter";
import {
  ConfigLabels,
  HighlightedOfficersDetail,
} from "../../InsightsStore/presenters/types";
import ModelHydrator from "../ModelHydrator";
import InsightsHighlightedOfficersBanner from "./InsightsHighlightedOfficersBanner";

const ManagedComponent = observer(function HighlightedOfficersBanner({
  presenter,
}: {
  presenter: {
    highlightedOfficers: HighlightedOfficersDetail[];
    labels: ConfigLabels;
  };
}) {
  return (
    <InsightsHighlightedOfficersBanner
      highlightedOfficers={presenter.highlightedOfficers}
      supervisionOfficerLabel={presenter.labels.supervisionOfficerLabel}
      staffPage
    />
  );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.officerPseudoId) return null;

  return new SupervisionOfficerOutcomesPresenter(
    supervisionStore,
    supervisionStore.officerPseudoId,
  );
}

export const ManagedStaffHighlightedOfficersBanner = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
