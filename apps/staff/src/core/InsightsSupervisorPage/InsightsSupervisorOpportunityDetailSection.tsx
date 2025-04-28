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
import { SupervisionSupervisorOpportunitiesPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunitiesPresenter";
import { Body, Grid } from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import ModelHydrator from "../ModelHydrator";
import { Wrapper } from "./InsightsBreadcrumbs";
import { EmptyCard } from "./InsightsStaffCardV2";
import { InsightsSupervisorOpportunityDetailCard } from "./InsightsSupervisorOpportunityDetailCard";

const usePresenter = () => {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
  } = useRootStore();

  if (
    !supervisionStore?.supervisorPseudoId ||
    !justiceInvolvedPersonsStore ||
    !opportunityConfigurationStore
  )
    return null;

  return supervisionStore?.supervisorPseudoId
    ? new SupervisionSupervisorOpportunitiesPresenter(
        supervisionStore,
        supervisionStore?.supervisorPseudoId,
        justiceInvolvedPersonsStore,
        opportunityConfigurationStore,
      )
    : null;
};

const ManagedComponent: React.FC<{
  presenter: SupervisionSupervisorOpportunitiesPresenter;
}> = observer(function OpportunityDetails({ presenter }) {
  const { opportunitiesDetails, isWorkflowsEnabled, labels } = presenter;

  return (
    <>
      {isWorkflowsEnabled && (
        <InsightsPageSection
          sectionTitle="Opportunities"
          sectionDescription={`Take action on opportunities that ${labels.supervisionJiiLabel}s may be eligible for.`}
        >
          <Wrapper>
            <Body>
              <ModelHydrator hydratable={presenter}>
                {opportunitiesDetails && opportunitiesDetails.length > 0 ? (
                  <Grid>
                    {opportunitiesDetails.map((opportunityDetail) => (
                      <InsightsSupervisorOpportunityDetailCard
                        opportunityInfo={opportunityDetail}
                        labels={labels}
                        key={opportunityDetail.label}
                      />
                    ))}
                  </Grid>
                ) : (
                  <EmptyCard
                    message={
                      labels.supervisorHasNoOfficersWithEligibleClientsLabel
                    }
                  />
                )}
              </ModelHydrator>
            </Body>
          </Wrapper>
        </InsightsPageSection>
      )}
    </>
  );
});

export const InsightsSupervisorOpportunityDetailSection = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
