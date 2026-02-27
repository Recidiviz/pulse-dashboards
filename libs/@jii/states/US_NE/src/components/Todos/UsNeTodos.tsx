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

import { observer } from "mobx-react-lite";
import { ReactNode } from "react";

import { HomepageSectionHeading } from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import {
  Hydratable,
  HydratorWithDirectHydration,
  withPresenterManager,
} from "~hydration-utils";

import { useUsNeContext } from "../usNeContext";
import { TodoCard } from "./TodoCard";
import { UsNeTodosPresenter } from "./UsNeTodosPresenter";

const ManagedComponent = observer(function ManagedComponent({
  presenter,
}: {
  presenter: UsNeTodosPresenter;
}) {
  const {
    copy: {
      home: { todos: copy },
    },
  } = useUsNeContext();

  const {
    goodTimeRestorationStatus,
    shouldShowReentryChecklist,
    shouldShowTodos,
    shouldShowReentryAssessment,
  } = presenter;

  if (!shouldShowTodos) {
    return null;
  }

  return (
    <section>
      <HomepageSectionHeading>{copy.sectionTitle}</HomepageSectionHeading>
      {goodTimeRestorationStatus && (
        <TodoCard
          {...copy.goodTimeRestoration[goodTimeRestorationStatus]}
          linkTarget={State.Resident.$.EGT.Definition.buildRelativePath({
            pageSlug: "gbmd",
          })}
        />
      )}
      {shouldShowReentryChecklist && (
        <TodoCard
          {...copy.reentryChecklist}
          linkTarget={State.Resident.$.UsNeReentryChecklist.buildRelativePath(
            {},
          )}
        />
      )}
      {shouldShowReentryAssessment && (
        <TodoCard
          {...copy.reentryAssessment}
          linkTarget={State.Resident.$.UsNeReentryAssessment.buildRelativePath(
            {},
          )}
        />
      )}
    </section>
  );
});

function usePresenter() {
  const { firebaseAuthClient, userStore } = useRootStore();
  const { resident, opportunities, residentFlags } = useSingleResidentContext();
  return new UsNeTodosPresenter(
    resident,
    opportunities,
    residentFlags,
    firebaseAuthClient,
    userStore,
  );
}

// We don't want to block rendering while hydrating, because in most cases (people without an assessment) hydration
// won't change anything. Right now hydration literally can't fail, so `failed` is just a passthrough too.
const TodosHydrator: React.FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => (
  <HydratorWithDirectHydration hydratable={hydratable} failed={children}>
    {children}
  </HydratorWithDirectHydration>
);

export const UsNeTodos = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
  HydratorComponent: TodosHydrator,
});
