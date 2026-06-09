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

import { isHydrated } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore/Client";

type TasksHydrator = {
  initial?: React.ReactNode;
  empty?: React.ReactNode;
  /**
   * Page-level skeleton rendered while supervision tasks are loading.
   * Defaults to a generic <Loading /> spinner when omitted.
   */
  loading?: React.ReactNode;
  hydrated: React.ReactNode;
};

export const CaseloadTasksHydrator = observer(function CaseloadTasksHydrator({
  initial,
  empty,
  loading,
  hydrated,
}: TasksHydrator) {
  const { workflowsStore } = useRootStore();
  const {
    searchStore: { selectedSearchIds },
  } = workflowsStore;

  const customTaskeEnabled =
    !!workflowsStore.rootStore.userStore.activeFeatureVariants.customTasks;

  useEffect(
    () =>
      autorun(() => {
        workflowsStore.caseloadPersons.forEach((person) => {
          if (person.supervisionTasks && !isHydrated(person.supervisionTasks)) {
            person.supervisionTasks.hydrate();
          }

          // Hydrate the per-client `customTasks` subscription so user-authored
          // custom tasks land in `TasksFilterStore.allTasksForCategory` for
          // users who haven't first visited the client's FullProfile (the
          // other site that triggers `customTasks.hydrate()`). Loading state
          // intentionally stays gated on supervision tasks only — custom
          // tasks are additive and shouldn't delay the table from showing.
          if (
            customTaskeEnabled &&
            person instanceof Client &&
            person.customTasks &&
            !isHydrated(person.customTasks)
          ) {
            person.customTasks.hydrate();
          }
        });
      }),
    [workflowsStore, customTaskeEnabled],
  );

  const displayInitialState = !selectedSearchIds.length;

  const displayLoading =
    !displayInitialState && !workflowsStore.supervisionTasksLoaded();

  const displayNoResults =
    !displayInitialState &&
    !displayLoading &&
    !workflowsStore.hasSupervisionTasks;

  if (displayInitialState) return <>{initial}</>;

  if (displayLoading) return <>{loading ?? <Loading />}</>;

  if (displayNoResults) return <>{empty}</>;

  return <>{hydrated}</>;
});
