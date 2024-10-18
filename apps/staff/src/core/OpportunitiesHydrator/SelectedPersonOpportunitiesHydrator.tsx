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

import { Loading } from "@recidiviz/design-system";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

import { isHydrated, isHydrationFinished } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { OpportunityType } from "../../WorkflowsStore/Opportunity";

type PersonOpportunitiesHydratorProps = {
  hydrated: React.ReactNode;
  empty: React.ReactNode;
  opportunityTypes: OpportunityType[];
  person: JusticeInvolvedPerson;
};

export const SelectedPersonOpportunitiesHydrator = observer(
  function SelectedPersonOpportunitiesHydrator({
    hydrated,
    empty,
    opportunityTypes,
    person,
  }: PersonOpportunitiesHydratorProps) {
    // The two useEffects below are isolated but could be simplified to one if the
    // useEffect that sets opportunity types is handled via a presenter.

    // This effect just reacts to the hydration state and hydrates the managers as needed
    useEffect(
      () =>
        autorun(() => {
          if (person && !isHydrated(person.opportunityManager))
            person.opportunityManager.hydrate();
        }),
      [person],
    );

    // This effect sets the desired opportunity types on the manager, which might
    // change the hydration state.
    useEffect(
      () =>
        autorun(() => {
          if (person)
            person.opportunityManager.setSelectedOpportunityTypes(
              opportunityTypes,
            );
        }),
      [person, opportunityTypes],
    );

    const displayLoading =
      person?.opportunityManager &&
      !isHydrationFinished(person?.opportunityManager);

    const displayEmpty =
      opportunityTypes.filter(
        (oppType) => oppType in (person?.opportunities ?? {}),
      ).length === 0;

    if (displayLoading) return <Loading />;

    if (displayEmpty) return <>{empty}</>;

    return <>{hydrated}</>;
  },
);
