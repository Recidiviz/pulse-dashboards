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
import { palette, Sans18 } from "@recidiviz/design-system";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { opportunityHeaders } from "../../WorkflowsStore";
import { CaseloadSelect } from "../CaseloadSelect";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import OpportunityTypeSummary from "./OpportunityTypeSummary";

const NoResultsText = styled(Sans18)`
  color: ${palette.slate70};
  margin: 0 25%;
  text-align: center;
`;

const WorkflowsHomepage = observer((): React.ReactElement | null => {
  const {
    workflowsStore: {
      allOpportunitiesLoaded,
      selectedOfficerIds,
      opportunityTypes,
      allOpportunitiesByType,
    },
  } = useRootStore();

  const allOpportunities = Object.values(allOpportunitiesByType).flat();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    autorun(() => {
      allOpportunities.forEach((opp) => {
        if (opp?.isLoading === undefined) {
          opp?.hydrate();
        }
      });
    }),
    [allOpportunities]
  );

  const hasOpportunities = allOpportunities.length > 0;

  const displayNoResults =
    selectedOfficerIds.length && allOpportunitiesLoaded && !hasOpportunities;

  return (
    <WorkflowsNavLayout>
      <CaseloadSelect />
      {allOpportunitiesLoaded &&
        hasOpportunities &&
        opportunityTypes.map((opportunityType) => {
          if (allOpportunitiesByType[opportunityType].length) {
            return (
              <OpportunityTypeSummary
                opportunities={allOpportunitiesByType[opportunityType]}
                opportunityType={opportunityType}
                header={opportunityHeaders[opportunityType]}
              />
            );
          }
          return null;
        })}
      {!!displayNoResults && (
        <NoResultsText>
          None of the clients on the selected officer(s) caseloads are eligible
          for opportunities. Search for another officer.
        </NoResultsText>
      )}
    </WorkflowsNavLayout>
  );
});

export default WorkflowsHomepage;
