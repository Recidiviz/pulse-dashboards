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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { isHydrated } from "~hydration-utils";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import InsightsPageLayout from "../InsightsPageLayout";
import { Body } from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import ModelHydrator from "../ModelHydrator";
import { HydratedOpportunityPersonList } from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import { insightsUrl } from "../views";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const OpportunityPageWithPresenter = observer(
  function OpportunityPageWithPresenter({
    presenter,
  }: {
    presenter: SupervisionOpportunityPresenter;
  }) {
    const {
      officerRecord,
      goToSupervisorInfo,
      labels,
      userCanAccessAllSupervisors,
      opportunityType,
      opportunities,
      opportunityLabel,
      opportunitiesByType,
      shouldLimitWidth,
    } = presenter;

    // If the presenter is hydrated and we're on an opportunity page, this stuff should
    // never be missing in practice.
    // TODO(#6983): the opportunities and opportunitiesByType are missing initially.
    if (!isHydrated(presenter)) return null;
    if (
      !officerRecord ||
      !opportunityType ||
      !opportunities ||
      !opportunitiesByType
    )
      return <NotFound />;

    return (
      <InsightsPageLayout
        limitedWidth={shouldLimitWidth}
        contentsAboveTitle={
          <InsightsBreadcrumbs
            previousPages={[
              ...(userCanAccessAllSupervisors
                ? [
                    {
                      title: "All Supervisors",
                      url: insightsUrl("supervisionSupervisorsList"),
                    },
                  ]
                : []),
              ...(goToSupervisorInfo
                ? [
                    {
                      title: `${goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel} Overview`,
                      url: insightsUrl("supervisionSupervisor", {
                        supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
                      }),
                    },
                  ]
                : []),
              {
                title: `${officerRecord.displayName} Profile`,
                url: insightsUrl("supervisionStaff", {
                  officerPseudoId: officerRecord.pseudonymizedId,
                }),
              },
            ]}
          >
            {opportunityLabel}
          </InsightsBreadcrumbs>
        }
      >
        <Wrapper>
          <Body>
            <HydratedOpportunityPersonList
              opportunityType={opportunityType}
              supervisionPresenter={presenter}
            />
          </Body>
        </Wrapper>
      </InsightsPageLayout>
    );
  },
);

const InsightsOpportunityPage = observer(function InsightsMetricPage() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
    workflowsStore,
  } = useRootStore();

  const officerPseudoId = supervisionStore?.officerPseudoId;
  const oppTypeUrl = supervisionStore?.opportunityTypeUrl;

  if (!officerPseudoId) return null;
  if (!oppTypeUrl) return null;
  if (!justiceInvolvedPersonsStore) return null;

  const opportunityType =
    opportunityConfigurationStore.getOpportunityTypeFromUrl(oppTypeUrl);

  const presenter = new SupervisionOpportunityPresenter(
    supervisionStore,
    justiceInvolvedPersonsStore,
    opportunityConfigurationStore,
    officerPseudoId,
    opportunityType,
  );

  // Needed in order to set a selectedPerson in the workflows store.
  workflowsStore.updateActiveSystem("SUPERVISION");

  return (
    <ModelHydrator hydratable={presenter}>
      <ModelHydrator hydratable={workflowsStore}>
        <OpportunityPageWithPresenter presenter={presenter} />
      </ModelHydrator>
    </ModelHydrator>
  );
});

export default InsightsOpportunityPage;
