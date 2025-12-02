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

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionSupervisorOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunityPresenter";
import ModelHydrator from "../ModelHydrator";
import { InsightsOpportunityFormPage as ManagedComponent } from "./InsightsOpportunityFormPage";

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
  } = useRootStore();

  const supervisorPseudoId = supervisionStore?.supervisorPseudoId;
  const oppTypeUrl = supervisionStore?.opportunityTypeUrl;
  const clientPseudoId = supervisionStore?.clientPseudoId;

  if (!supervisorPseudoId) return null;
  if (!oppTypeUrl) return null;
  if (!clientPseudoId) return null;
  if (!justiceInvolvedPersonsStore) return null;

  const opportunityType =
    opportunityConfigurationStore.getOpportunityTypeFromUrl(oppTypeUrl);

  return new SupervisionSupervisorOpportunityPresenter(
    supervisionStore,
    justiceInvolvedPersonsStore,
    opportunityConfigurationStore,
    supervisorPseudoId,
    opportunityType,
  );
}

const InsightsSupervisorOpportunityFormPage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});

export default InsightsSupervisorOpportunityFormPage;
