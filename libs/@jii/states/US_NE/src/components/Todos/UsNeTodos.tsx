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
import {
  useResidentMetadata,
  useRootStore,
  useSingleResidentContext,
} from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsNeTranslations } from "~@jii/translation";
import {
  Hydratable,
  HydratorWithDirectHydration,
  withPresenterManager,
} from "~hydration-utils";

import { TodoCard } from "./TodoCard";
import { UsNeTodosPresenter } from "./UsNeTodosPresenter";

const ManagedComponent = observer(function ManagedComponent({
  presenter,
}: {
  presenter: UsNeTodosPresenter;
}) {
  const metadata = useResidentMetadata("US_NE");
  const { t } = useUsNeTranslations();

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
      <HomepageSectionHeading>
        {t(($) => $.home.todos.sectionTitle)}
      </HomepageSectionHeading>
      {goodTimeRestorationStatus && (
        <TodoCard
          title={t(
            ($) =>
              $.home.todos.goodTimeRestoration[goodTimeRestorationStatus].title,
          )}
          body={t(
            ($) =>
              $.home.todos.goodTimeRestoration[goodTimeRestorationStatus].body,
            {
              goodTimeLostDaysRestorable: metadata.goodTimeLostDaysRestorable,
              count: presenter.goodTimeRestorationMonthsRemaining,
            },
          )}
          linkText={t(
            ($) =>
              $.home.todos.goodTimeRestoration[goodTimeRestorationStatus]
                .linkText,
          )}
          linkTarget={State.Resident.$.UsNeMoreInformation.buildRelativePath({
            pageSlug: "gbmd",
          })}
        />
      )}
      {shouldShowReentryChecklist && (
        <TodoCard
          title={t(($) => $.home.todos.reentryChecklist.title)}
          body={t(($) => $.home.todos.reentryChecklist.body)}
          linkText={t(($) => $.home.todos.reentryChecklist.linkText)}
          linkTarget={State.Resident.$.UsNeReentryChecklist.buildRelativePath(
            {},
          )}
        />
      )}
      {shouldShowReentryAssessment && (
        <TodoCard
          title={t(($) => $.home.todos.reentryAssessment.title)}
          body={t(($) => $.home.todos.reentryAssessment.body)}
          linkText={t(($) => $.home.todos.reentryAssessment.linkText)}
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
