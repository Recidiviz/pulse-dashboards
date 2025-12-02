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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect } from "react";
import styled from "styled-components";

import { isHydrated } from "~hydration-utils";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionSupervisorOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunityPresenter";
import InsightsPageLayout from "../InsightsPageLayout";
import { Body } from "../InsightsPageLayout/InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import ModelHydrator from "../ModelHydrator";
import { HydratedOpportunityPersonList } from "../OpportunityCaseloadView/HydratedOpportunityPersonList";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/**
 * A page containing opportunities relevant to a particular supervisor (i.e. the
 * opportunities of all reporting officers)
 */
export const SupervisorOpportunityPageWithPresenter = observer(
  function SupervisorOpportunityPageWithPresenter({
    presenter,
  }: {
    presenter: SupervisionSupervisorOpportunityPresenter;
  }) {
    const {
      supervisorInfo,
      previousPages,
      opportunityType,
      opportunities,
      opportunityLabel,
      opportunitiesByType,
    } = presenter;

    // If the presenter is hydrated and we're on an opportunity page, this stuff should
    // never be missing in practice.
    // TODO(#6983): the opportunities and opportunitiesByType are missing initially.
    if (!isHydrated(presenter)) return null;
    if (
      !supervisorInfo ||
      !opportunityType ||
      !opportunities ||
      !opportunitiesByType
    )
      return <NotFound />;

    return (
      <InsightsPageLayout
        limitedWidth={false}
        contentsAboveTitle={
          <InsightsBreadcrumbs previousPages={previousPages}>
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

const InsightsSupervisorOpportunityPage = observer(
  function InsightsSupervisorOpportunityPage() {
    const {
      insightsStore: { supervisionStore },
      workflowsRootStore: {
        justiceInvolvedPersonsStore,
        opportunityConfigurationStore,
      },
      workflowsStore,
    } = useRootStore();

    // Needed in order to set a selectedPerson in the workflows store.
    useEffect(() => {
      workflowsStore.updateActiveSystem("SUPERVISION");
    }, [workflowsStore]);

    const supervisorPseudoId = supervisionStore?.supervisorPseudoId;
    const oppTypeUrl = supervisionStore?.opportunityTypeUrl;

    if (!supervisorPseudoId) return null;
    if (!oppTypeUrl) return null;
    if (!justiceInvolvedPersonsStore) return null;

    const opportunityType =
      opportunityConfigurationStore.getOpportunityTypeFromUrl(oppTypeUrl);

    const presenter = new SupervisionSupervisorOpportunityPresenter(
      supervisionStore,
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
      supervisorPseudoId,
      opportunityType,
    );

    return (
      <ModelHydrator hydratable={presenter}>
        <ModelHydrator hydratable={workflowsStore}>
          <SupervisorOpportunityPageWithPresenter presenter={presenter} />
        </ModelHydrator>
      </ModelHydrator>
    );
  },
);

export default InsightsSupervisorOpportunityPage;
