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
import { ModelHydratorWithoutTransitions } from "../../InsightsStore/hydrators/ModelHydratorWithoutTransitions";
import { SupervisionSupervisorRosterModalPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorRosterModalPresenter";
import InsightsSupervisorRosterModal from "./InsightsSupervisorRosterModal";

const ManagedComponent: React.FC<{
  presenter: SupervisionSupervisorRosterModalPresenter;
}> = observer(function SupervisorRosterModal({ presenter }) {
  if (!presenter.userCanSubmitRosterChangeRequest) return null;
  return <InsightsSupervisorRosterModal presenter={presenter} />;
});

const usePresenter = () => {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  return supervisionStore?.supervisorPseudoId
    ? new SupervisionSupervisorRosterModalPresenter(
        supervisionStore,
        supervisionStore?.supervisorPseudoId,
      )
    : null;
};

export const InsightsManagedSupervisorRosterModal = withPresenterManager({
  managerIsObserver: true,
  usePresenter,
  ManagedComponent,
  HydratorComponent: ModelHydratorWithoutTransitions, // Hydrates; renders immediately regardless of state
});
