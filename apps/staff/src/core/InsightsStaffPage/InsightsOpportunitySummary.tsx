// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { SupervisionOfficerOpportunitiesPresenter } from "../../InsightsStore/presenters/SupervisionOfficerOpportunitiesPresenter";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import { EmptyCard } from "../InsightsSupervisorPage/InsightsStaffCardV2";
import ModelHydrator from "../ModelHydrator";
import { OpportunitySummaries } from "../WorkflowsHomepage/OpportunitySummaries";

const ManagedComponent = observer(function OpportunitySummary({
  presenter,
}: {
  presenter: SupervisionOfficerOpportunitiesPresenter;
}) {
  const {
    opportunitiesByType,
    numEligibleOpportunities,
    labels,
    officerPseudoId,
    officerOutcomesData,
    opportunityTypes,
  } = presenter;

  return opportunitiesByType ? (
    <InsightsPageSection
      sectionTitle={`Opportunities (${numEligibleOpportunities ?? 0})`}
    >
      {numEligibleOpportunities ? (
        <OpportunitySummaries
          opportunitiesByType={opportunitiesByType}
          opportunityTypes={opportunityTypes}
          officerPseudoId={officerPseudoId}
          zeroGrantOpportunities={officerOutcomesData?.zeroGrantOpportunities}
        />
      ) : (
        <EmptyCard
          message={labels.officerHasNoEligibleClientsLabel}
          height={200}
        />
      )}
    </InsightsPageSection>
  ) : null;
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
  } = useRootStore();

  const officerPseudoId = supervisionStore?.officerPseudoId;

  if (!officerPseudoId || !justiceInvolvedPersonsStore) return null;

  return new SupervisionOfficerOpportunitiesPresenter(
    supervisionStore,
    officerPseudoId,
    justiceInvolvedPersonsStore,
    opportunityConfigurationStore,
  );
}

export const InsightsOpportunitySummary = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
