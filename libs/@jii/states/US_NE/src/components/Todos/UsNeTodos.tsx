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

import { HomepageSectionHeading } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { withPresenterManager } from "~hydration-utils";

import { useUsNeContext } from "../usNeContext";
import { TodoCard } from "./TodoCard";
import { UsNeTodosPresenter } from "./UsNeTodosPresenter";

function ManagedComponent({ presenter }: { presenter: UsNeTodosPresenter }) {
  const {
    copy: {
      home: { todos: copy },
    },
  } = useUsNeContext();

  const {
    goodTimeRestorationStatus,
    shouldShowReentryChecklist,
    shouldShowTodos,
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
        <TodoCard {...copy.reentryChecklist} linkTarget="#" />
      )}
    </section>
  );
}

function usePresenter() {
  const { resident, opportunities } = useSingleResidentContext();
  return new UsNeTodosPresenter(resident, opportunities);
}

export const UsNeTodos = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
});
