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

import { Loading } from "@recidiviz/design-system";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { OpportunityType } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { isHydrationInProgress } from "../models/utils";

type PersonOpportunitiesHydratorProps = {
  hydrated: React.ReactNode;
  empty: React.ReactNode;
  opportunityTypes: OpportunityType[];
};

export const SelectedPersonOpportunitiesHydrator = observer(
  function SelectedPersonOpportunitiesHydrator({
    hydrated,
    empty,
    opportunityTypes,
  }: PersonOpportunitiesHydratorProps) {
    const {
      workflowsStore: { selectedPerson: person },
    } = useRootStore();

    useEffect(
      () =>
        autorun(() => {
          if (person) {
            const { potentialOpportunities } = person;
            opportunityTypes.forEach((opportunityType) => {
              potentialOpportunities[opportunityType]?.hydrate();
            });
          }
        }),
      [person, opportunityTypes]
    );

    const displayLoading = opportunityTypes.some((oppType) => {
      const opp = person?.potentialOpportunities[oppType];
      return opp && isHydrationInProgress(opp);
    });

    const displayEmpty =
      opportunityTypes.filter(
        (oppType) => oppType in (person?.verifiedOpportunities ?? {})
      ).length === 0;

    if (displayLoading) return <Loading />;

    if (displayEmpty) return <>{empty}</>;

    return <>{hydrated}</>;
  }
);
