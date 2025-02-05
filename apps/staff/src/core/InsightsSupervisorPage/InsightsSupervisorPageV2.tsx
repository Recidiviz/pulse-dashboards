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
import { StyledLink } from "../CaseNoteSearch/components/SearchView/SearchView";
import { useInsightsActionStrategyModal } from "../InsightsActionStrategyModal";
import InsightsHighlightedOfficersBanner from "../InsightsHighlightedOfficersBanner";
import InsightsPageLayout from "../InsightsPageLayout";
import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { InsightsBreadcrumbs } from "./InsightsBreadcrumbs";
import InsightsStaffCardV2 from "./InsightsStaffCardV2";
import { InsightsSupervisorActionStrategyBanner } from "./InsightsSupervisorActionStrategyBanner";
import { InsightsSupervisorOpportunityDetailSection } from "./InsightsSupervisorOpportunityDetailSection";
import { InsightsSupervisorVitals } from "./InsightsSupervisorVitals";

const HighlightedDescription = styled.span`
  border-bottom: 1px dashed ${palette.slate85};
`;

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
  title: string;
  officers: { pseudonymizedId: string; displayName: string }[];
}> = ({ title, officers }) => {
  return (
    <React.Fragment key={title}>
      <OfficersTooltipHeading>{title}</OfficersTooltipHeading>
      <div>
        {officers.map((officer) => (
          <div key={officer.pseudonymizedId}>{officer.displayName}</div>
        ))}
      </div>
    </React.Fragment>
  );
};

const SupervisorPageV2 = observer(function SupervisorPageV2({
  presenter,
}: {
  presenter: SupervisionSupervisorPagePresenter;
}) {
  const { openModal } = useInsightsActionStrategyModal();
  const { actionStrategies } = useFeatureVariants();
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

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
      info: supervisionLocationInfo.supervisionLocation,
    },
    {
      title: "team",
      info: `${pluralize(
        allOfficers.length,
        toTitleCase(labels.supervisionOfficerLabel),
      )}`,
      tooltip: (
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
      ),
    },
  ];

  const pageDescription = (
    <>
      Measure your team’s performance across other{" "}
      {labels.supervisionOfficerLabel}s in the state.{" "}
      {toTitleCase(labels.supervisionOfficerLabel)}s surfaced are{" "}
      <InsightsTooltip
        contents={`${toTitleCase(labels.supervisionOfficerLabel)} shown are one Interquartile Range above the statewide rate.`}
      >
        <HighlightedDescription>
          {labels.worseThanRateLabel.toLowerCase()}
        </HighlightedDescription>
      </InsightsTooltip>
      . Rates for the metrics below are calculated for the time period:{" "}
      {timePeriod}.{" "}
      {actionStrategies && (
        <StyledLink
          to="#"
          onClick={() => openModal({ showActionStrategyList: true })}
        >
          See action strategies.
        </StyledLink>
      )}
    </>
  );

  if (initialPageLoad) {
    presenter.trackViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={pageTitle}
      pageSubtitle="Outcomes"
      infoItems={infoItems}
      pageDescription={pageDescription}
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
      <InsightsSupervisorActionStrategyBanner />
      <InsightsStaffCardV2 />
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
