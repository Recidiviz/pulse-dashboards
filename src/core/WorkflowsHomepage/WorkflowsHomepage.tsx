// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import React from "react";
import simplur from "simplur";

import { useRootStore } from "../../components/StoreProvider";
import { OPPORTUNITY_LABELS, OpportunityType } from "../../WorkflowsStore";
import { CaseloadSelect } from "../CaseloadSelect";
import { OpportunitiesHydrator } from "../OpportunitiesHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsNoResults from "../WorkflowsNoResults";
import OpportunityTypeSummary from "./OpportunityTypeSummary";

function getWelcomeText(userName: string | undefined): string {
  if (!userName) return "Welcome";
  return `Welcome, ${userName}`;
}

function getSelectOpportunitiesText(
  opportunityTypes: OpportunityType[]
): string {
  const topTwoOpportunities = opportunityTypes.slice(0, 2);
  let selectOpportunityText = `${OPPORTUNITY_LABELS[topTwoOpportunities[0]]}`;
  if (topTwoOpportunities.length > 1) {
    selectOpportunityText += ` and ${
      OPPORTUNITY_LABELS[topTwoOpportunities[1]]
    }`;
  }
  return selectOpportunityText;
}

const WorkflowsHomepage = observer((): React.ReactElement | null => {
  const {
    workflowsStore: {
      selectedOfficerIds,
      opportunityTypes,
      allOpportunitiesByType,
      user,
    },
  } = useRootStore();

  const initial = (
    <WorkflowsNoResults
      headerText={getWelcomeText(user?.info.givenNames)}
      callToActionText={`Search for officers above to review and refer eligible clients for 
        opportunities like ${getSelectOpportunitiesText(opportunityTypes)}.`}
    />
  );

  const empty = (
    <WorkflowsNoResults
      callToActionText={simplur`None of the clients on the selected ${[
        selectedOfficerIds.length,
      ]} officer['s|s'] caseloads are eligible for opportunities. Search for another officer.`}
    />
  );

  const hydrated = opportunityTypes.map((opportunityType) => {
    if (allOpportunitiesByType[opportunityType].length) {
      return (
        <OpportunityTypeSummary
          key={opportunityType}
          opportunities={allOpportunitiesByType[opportunityType]}
          opportunityType={opportunityType}
        />
      );
    }
    return null;
  });

  return (
    <WorkflowsNavLayout>
      <CaseloadSelect />
      <OpportunitiesHydrator {...{ initial, empty, hydrated }} />
    </WorkflowsNavLayout>
  );
});

export default WorkflowsHomepage;
