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

import { toTitleCase } from "@artsy/to-title-case";
import { palette } from "@recidiviz/design-system";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { StyledLink } from "../CaseNoteSearch/components/SearchView/SearchView";
import { useInsightsActionStrategyModal } from "../InsightsActionStrategyModal";
import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import InsightsStaffCardV2 from "./InsightsStaffCardV2";
import { InsightsSupervisorActionStrategyBanner } from "./InsightsSupervisorActionStrategyBanner";

const HighlightedDescription = styled.span`
  border-bottom: 1px dashed ${palette.slate85};
`;

export const InsightsOutcomesModule = ({
  labels,
  timePeriod,
}: {
  labels: ConfigLabels;
  timePeriod?: string;
}) => {
  const { actionStrategies, outcomesModule } = useFeatureVariants();
  const { openModal } = useInsightsActionStrategyModal();

  if (!outcomesModule) return;

  const description = (
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

  return (
    <InsightsPageSection
      sectionTitle="Outcomes"
      sectionDescription={description}
    >
      <InsightsSupervisorActionStrategyBanner />
      <InsightsStaffCardV2 />
    </InsightsPageSection>
  );
};
