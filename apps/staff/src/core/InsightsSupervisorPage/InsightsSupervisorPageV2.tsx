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
import { useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionSupervisorPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorPresenter";
import { getDistrictWithoutLabel } from "../../InsightsStore/presenters/utils";
import { pluralize, toTitleCase } from "../../utils";
import InsightsPageLayout from "../InsightsPageLayout";
import {
  Body,
  Grid,
  InsightsTooltip,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { InsightsBreadcrumbs } from "./InsightsBreadcrumbs";
import InsightsStaffCardV2 from "./InsightsStaffCardV2";
import { InsightsSupervisorOpportunityDetailCard } from "./InsightsSupervisorOpportunityDetailCard";

const HighlightedDescription = styled.span`
  border-bottom: 1px dashed ${palette.slate85};
`;

const OfficersTooltipHeading = styled.div`
  color: ${palette.white80};
  font-size: 12px;
  margin-bottom: ${rem(spacing.sm)};
  letter-spacing: 0.05em;
`;

const ExcludedOfficersTooltipHeading = styled(OfficersTooltipHeading)`
  margin-top: ${rem(spacing.md)};
`;

const SupervisorPageV2 = observer(function SupervisorPageV2({
  presenter,
}: {
  presenter: SupervisionSupervisorPresenter;
}) {
  const { isLaptop } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    supervisorInfo,
    outlierOfficersData,
    // TODO: (6040) Change this to `allOfficers` once backend is updated.
    officersWithOutliersData: allOfficers,
    excludedOfficers,
    userCanAccessAllSupervisors,
    timePeriod,
    labels,
    isWorkflowsEnabled,
    opportunitiesDetails,
    outlierOfficersByMetricAndCaseloadCategory,
  } = presenter;

  const tooltipContents = (
    <>
      {allOfficers && (
        <>
          <OfficersTooltipHeading>INCLUDED IN OUTCOMES</OfficersTooltipHeading>
          <div>
            {allOfficers.map((officer) => (
              <div key={officer.pseudonymizedId}>{officer.displayName}</div>
            ))}
          </div>
        </>
      )}
      {!!excludedOfficers?.length && (
        <>
          <ExcludedOfficersTooltipHeading>
            EXCLUDED FROM OUTCOMES
          </ExcludedOfficersTooltipHeading>
          <div>
            {excludedOfficers.map((officer) => (
              <div key={officer.pseudonymizedId}>{officer.displayName}</div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const numOfficers =
    (excludedOfficers?.length || 0) + (allOfficers?.length || 0);

  const infoItems = [
    {
      title: labels.supervisionDistrictLabel,
      info: getDistrictWithoutLabel(
        supervisorInfo?.supervisionDistrict,
        labels.supervisionDistrictLabel,
      ),
    },
    {
      title: "team",
      info: `${pluralize(numOfficers, toTitleCase(labels.supervisionOfficerLabel))}`,
      tooltip: tooltipContents,
    },
  ];

  const pageTitle = `${supervisorInfo?.displayName} Overview`;

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
      {timePeriod}.
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
    >
      <Wrapper isLaptop={isLaptop} supervisorHomepage>
        <Body>
          <InsightsStaffCardV2
            outlierOfficersByMetricAndCaseloadCategory={
              outlierOfficersByMetricAndCaseloadCategory
            }
            officers={outlierOfficersData}
            emptyMessage={labels.supervisorHasNoOutlierOfficersLabel}
          />
          {opportunitiesDetails &&
            opportunitiesDetails.length > 0 &&
            isWorkflowsEnabled && (
              <InsightsPageSection
                sectionTitle="Opportunities"
                sectionDescription={`Take action on opportunities that ${labels.supervisionJiiLabel}s may be eligible for.`}
              >
                <Wrapper isLaptop={isLaptop} supervisorHomepage>
                  <Body>
                    <Grid>
                      {opportunitiesDetails.map((opportunityDetail) => (
                        <InsightsSupervisorOpportunityDetailCard
                          opportunityInfo={opportunityDetail}
                          labels={labels}
                          key={opportunityDetail.label}
                        />
                      ))}
                    </Grid>
                  </Body>
                </Wrapper>
              </InsightsPageSection>
            )}
        </Body>
      </Wrapper>
    </InsightsPageLayout>
  );
});

const InsightsSupervisorPageV2 = observer(function InsightsSupervisorPageV2() {
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

  const presenter = new SupervisionSupervisorPresenter(
    supervisionStore,
    supervisionStore.supervisorPseudoId,
    justiceInvolvedPersonsStore,
    opportunityConfigurationStore,
  );

  return (
    <ModelHydrator model={presenter}>
      <SupervisorPageV2 presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsSupervisorPageV2;
