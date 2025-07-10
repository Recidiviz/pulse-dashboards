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

import { countBy } from "lodash";
import { observer } from "mobx-react-lite";

import { OpportunityType } from "~datatypes";

import { useOpportunityConfigurations } from "../../components/StoreProvider";
import {
  countOpportunities,
  Opportunity,
  OpportunityTabGroup,
} from "../../WorkflowsStore";
import { insightsUrl, workflowsUrl } from "../views";
import { WorkflowsHomepageSummary } from "./WorkflowsHomepageSummary";

const OpportunityTypeSummary = observer(function OpportunityTypeSummary({
  opportunities,
  opportunityType,
  officerPseudoId,
  showZeroGrantsPill,
}: {
  opportunities: Opportunity[];
  opportunityType: OpportunityType;
  officerPseudoId?: string;
  showZeroGrantsPill?: boolean;
}): React.ReactElement | null {
  const { eligibilityTextForCount, urlSection, zeroGrantsTooltip, tabGroups } =
    useOpportunityConfigurations()[opportunityType];

  const totalOpportunityCount = countOpportunities(opportunities);
  const people = opportunities.map((opp) => opp.person);

  // there should always be at least one tab group to display the tab names from
  const tabGroup = Object.keys(tabGroups)[0] as OpportunityTabGroup;
  const numOpportunitiesByTab = countBy(opportunities, (opp) =>
    opp.tabTitle(tabGroup),
  );

  const navigationURL = officerPseudoId
    ? insightsUrl("supervisionOpportunity", {
        officerPseudoId,
        opportunityTypeUrl: urlSection,
      })
    : workflowsUrl("opportunityClients", { urlSection });

  return (
    <WorkflowsHomepageSummary
      url={navigationURL}
      headerText={eligibilityTextForCount(totalOpportunityCount)}
      reviewStatusCounts={numOpportunitiesByTab}
      totalCount={totalOpportunityCount}
      people={people}
      showZeroGrantsPill={!!showZeroGrantsPill}
      zeroGrantsTooltip={zeroGrantsTooltip}
    />
  );
});

export default OpportunityTypeSummary;
