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

import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useState } from "react";
import styled from "styled-components/macro";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { SupervisionSupervisorPagePresenter } from "../../InsightsStore/presenters/SupervisionSupervisorPagePresenter";
import { pluralize, toTitleCase } from "../../utils";
import InsightsHighlightedOfficersBanner from "../InsightsHighlightedOfficersBanner";
import InsightsPageLayout from "../InsightsPageLayout";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { InsightsBreadcrumbs } from "./InsightsBreadcrumbs";
import { InsightsOutcomesModule } from "./InsightsOutcomesModule";
import { InsightsSupervisorOpportunityDetailSection } from "./InsightsSupervisorOpportunityDetailSection";
import { InsightsSupervisorVitals } from "./InsightsSupervisorVitals";

const OfficersTooltipHeading = styled.div`
  color: ${palette.white80};
  font-size: 12px;
  margin-bottom: ${rem(spacing.sm)};
  letter-spacing: 0.05em;
  &:not(:first-child) {
    margin-top: ${rem(spacing.md)};
  }
`;

const InsightsSupervisorOutcomeTooltip: React.FC<{
  title?: string;
  officers: { pseudonymizedId: string; displayName: string }[];
}> = ({ title, officers }) => {
  return (
    <>
      {title && <OfficersTooltipHeading>{title}</OfficersTooltipHeading>}
      <div>
        {officers.map((officer) => (
          <div key={officer.pseudonymizedId}>{officer.displayName}</div>
        ))}
      </div>
    </>
  );
};

const SupervisorPageV2 = observer(function SupervisorPageV2({
  presenter,
}: {
  presenter: SupervisionSupervisorPagePresenter;
}) {
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);
  const { outcomesModule } = useFeatureVariants();

  const {
    supervisorInfo,
    officersIncludedInOutcomes,
    officersExcludedFromOutcomes,
    userCanAccessAllSupervisors,
    timePeriod,
    labels,
    supervisionLocationInfo,
    supervisorPseudoId,
    allOfficers,
    pageTitle,
    highlightedOfficersByMetric,
  } = presenter;

  const infoItems = [
    {
      title: supervisionLocationInfo.locationLabel,
      info: supervisionLocationInfo.supervisionLocationForSupervisorPage,
    },
    {
      title: "team",
      info: `${pluralize(
        allOfficers.length,
        toTitleCase(labels.supervisionOfficerLabel),
      )}`,
      tooltip: outcomesModule ? (
        <>
          {!!officersIncludedInOutcomes?.length && (
            <InsightsSupervisorOutcomeTooltip
              title="INCLUDED IN OUTCOMES"
              officers={officersIncludedInOutcomes}
            />
          )}
          {!!officersExcludedFromOutcomes?.length && (
            <InsightsSupervisorOutcomeTooltip
              title="EXCLUDED FROM OUTCOMES"
              officers={officersExcludedFromOutcomes}
            />
          )}
        </>
      ) : (
        <>
          {!!allOfficers?.length && (
            <InsightsSupervisorOutcomeTooltip officers={allOfficers} />
          )}
        </>
      ),
    },
  ];

  if (initialPageLoad) {
    presenter.trackViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={pageTitle}
      infoItems={infoItems}
      hasSupervisionInfoModal={false}
      contentsAboveTitle={
        userCanAccessAllSupervisors && (
          <InsightsBreadcrumbs
            previousPages={
              userCanAccessAllSupervisors
                ? [
                    {
                      title: "All Supervisors",
                      url: insightsUrl("supervisionSupervisorsList"),
                    },
                  ]
                : []
            }
          >
            {supervisorInfo?.displayName}
          </InsightsBreadcrumbs>
        )
      }
      highlightedOfficers={
        <InsightsHighlightedOfficersBanner
          highlightedOfficers={highlightedOfficersByMetric}
          supervisionOfficerLabel={labels.supervisionOfficerLabel}
          generateLinks
        />
      }
    >
      <InsightsOutcomesModule labels={labels} timePeriod={timePeriod} />
      <InsightsSupervisorOpportunityDetailSection />
      <InsightsSupervisorVitals supervisorPseudoId={supervisorPseudoId} />
    </InsightsPageLayout>
  );
});

const InsightsSupervisorPageV2 = observer(function InsightsSupervisorPageV2() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.supervisorPseudoId) return null;

  const presenter = new SupervisionSupervisorPagePresenter(
    supervisionStore,
    supervisionStore.supervisorPseudoId,
  );

  return (
    <ModelHydrator hydratable={presenter}>
      <SupervisorPageV2 presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsSupervisorPageV2;
