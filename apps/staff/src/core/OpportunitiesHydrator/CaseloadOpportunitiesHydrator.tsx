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

import { OpportunityType } from "~datatypes";
import { isHydrationStarted } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";

type OpportunitiesHydratorProps = {
  initial: React.ReactNode;
  empty: React.ReactNode;
  hydrated: React.ReactNode;
  opportunityTypes: OpportunityType[];
};

export const CaseloadOpportunitiesHydrator = observer(
  function CaseloadOpportunitiesHydrator({
    initial,
    empty,
    hydrated,
    opportunityTypes,
  }: OpportunitiesHydratorProps) {
    const { workflowsStore } = useRootStore();
    const { selectedSearchIds } = workflowsStore;

    // The two useEffects below are isolated but could be simplified to one if the
    // useEffect that sets opportunity types is handled via a presenter.

    // This effect just reacts to the hydration state and hydrates the managers as needed
    useEffect(
      () =>
        autorun(
          () => {
            workflowsStore.caseloadPersons.forEach((person) => {
              if (!isHydrationStarted(person.opportunityManager))
                person.opportunityManager.hydrate();
            });
          },
          { delay: 10 },
        ),
      [workflowsStore],
    );

    // This effect sets the desired opportunity types on the manager, which might
    // change the hydration state.
    useEffect(
      () =>
        autorun(() => {
          workflowsStore.caseloadPersons.forEach((person) => {
            person.opportunityManager.setSelectedOpportunityTypes(
              opportunityTypes,
            );
          });
        }),
      [workflowsStore, opportunityTypes],
    );

    const displayInitialState = !selectedSearchIds.length;
    const displayLoading =
      !displayInitialState && !workflowsStore.opportunitiesLoaded();
    const displayNoResults =
      !displayInitialState &&
      !displayLoading &&
      !workflowsStore.hasOpportunities(opportunityTypes);

    if (displayInitialState) return <>{initial}</>;

    if (displayLoading) return <Loading />;

    if (displayNoResults) return <>{empty}</>;

    return <>{hydrated}</>;
  },
);
