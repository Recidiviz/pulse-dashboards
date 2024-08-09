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

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import InsightsPageLayout from "../InsightsPageLayout";
import { Body, Wrapper } from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";

export const OpportunityPageWithPresenter = observer(
  function OpportunityPageWithPresenter({
    presenter,
  }: {
    presenter: SupervisionOpportunityPresenter;
  }) {
    const { isLaptop } = useIsMobile(true);

    const {
      outlierOfficerData,
      goToSupervisorInfo,
      labels,
      userCanAccessAllSupervisors,
      opportunityType,
      opportunities,
      opportunityLabel,
    } = presenter;

    // If the presenter is hydrated and we're on an opportunity page, this stuff should
    // never be missing in practice.
    if (!outlierOfficerData || !opportunityType || !opportunities) {
      return <NotFound />;
    }

    return (
      <InsightsPageLayout
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
                title: `${outlierOfficerData.displayName} Profile`,
                url: insightsUrl("supervisionStaff", {
                  officerPseudoId: outlierOfficerData.pseudonymizedId,
                }),
              },
            ]}
          >
            {opportunityLabel}
          </InsightsBreadcrumbs>
        }
      >
        <Wrapper isLaptop={isLaptop}>
          <Body supervisorHomepage>TODO: insert person list here</Body>
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
  } = useRootStore();

  const officerPseudoId = supervisionStore?.officerPseudoId;
  const oppTypeUrl = supervisionStore?.opportunityTypeUrl;

  if (!officerPseudoId) return null;
  if (!oppTypeUrl) return null;
  if (!justiceInvolvedPersonsStore) return null;

  const presenter = new SupervisionOpportunityPresenter(
    supervisionStore,
    justiceInvolvedPersonsStore,
    officerPseudoId,
    opportunityConfigurationStore.getOpportunityTypeFromUrl(oppTypeUrl),
  );

  return (
    <ModelHydrator model={presenter}>
      <OpportunityPageWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsOpportunityPage;
