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

import { OpportunityType } from "~datatypes";

import { useOpportunityConfigurations } from "../../components/StoreProvider";
import { insightsUrl, workflowsUrl } from "../views";
import type { OpportunitySummaryData } from "./summaryData";
import { WorkflowsHomepageSummary } from "./WorkflowsHomepageSummary";

const OpportunityTypeSummary = observer(function OpportunityTypeSummary({
  opportunityType,
  officerPseudoId,
  showZeroGrantsPill,
  summary,
}: {
  opportunityType: OpportunityType;
  officerPseudoId?: string;
  showZeroGrantsPill?: boolean;
  summary: OpportunitySummaryData;
}): React.ReactElement<any> | null {
  const { eligibilityTextForCount, urlSection, zeroGrantsTooltip, tabGroups } =
    useOpportunityConfigurations()[opportunityType];

  // there should always be at least one tab group to display the tab names from
  const tabTitles = Object.values(tabGroups)[0];

  const displayedTabCounts = Object.fromEntries(
    tabTitles
      .filter((tabTitle) => summary.tabCounts[tabTitle] > 0)
      .map((tabTitle) => [tabTitle, summary.tabCounts[tabTitle]]),
  );

  // Some opportunities have opportunities for non-enabled tabs,
  // but we don't show a summary if those are the only opps
  if (Object.keys(displayedTabCounts).length === 0) return null;

  const navigationURL = officerPseudoId
    ? insightsUrl("supervisionOpportunity", {
        officerPseudoId,
        opportunityTypeUrl: urlSection,
      })
    : workflowsUrl("opportunityClients", { urlSection });

  return (
    <WorkflowsHomepageSummary
      url={navigationURL}
      headerText={eligibilityTextForCount(summary.totalCount)}
      reviewStatusCounts={displayedTabCounts}
      totalCount={summary.totalCount}
      people={summary.people}
      showZeroGrantsPill={!!showZeroGrantsPill}
      zeroGrantsTooltip={zeroGrantsTooltip}
    />
  );
});

export default OpportunityTypeSummary;
