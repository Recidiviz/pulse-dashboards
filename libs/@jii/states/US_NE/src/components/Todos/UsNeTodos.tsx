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

import { ErrorBoundary } from "@sentry/react";
import {
  QueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { ReactNode, Suspense } from "react";

import { Card, HomepageSectionHeading, SlateCopy } from "~@jii/common-ui";
import {
  useNewResidentData,
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
import { UsNeCheckInTodo } from "./UsNeCheckInTodo";
import { UsNeTodosError } from "./UsNeTodosError";
import { UsNeTodosLoading } from "./UsNeTodosLoading";
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
    checkInFormData,
    shouldShowCheckInTodo,
  } = presenter;

  if (!shouldShowTodos) {
    return (
      <Card>
        <SlateCopy>{t(($) => $.home.todos.noTodos)}</SlateCopy>
      </Card>
    );
  }

  return (
    <>
      {shouldShowCheckInTodo && checkInFormData && (
        <UsNeCheckInTodo assignedAt={checkInFormData.createdAt} />
      )}
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
          linkTarget={State.Resident.$.ReentryAssessment.buildRelativePath({})}
        />
      )}
    </>
  );
});

function usePresenter() {
  const { firebaseAuthClient, userStore, apiClient } = useRootStore();
  const {
    resident,
    opportunities,
    residentFlags: { usNeCheckInTool },
  } = useSingleResidentContext();
  const stateData = useResidentMetadata("US_NE");
  const newDataFlag = useNewResidentData();

  const checkInFormQuery = useSuspenseQuery(
    apiClient.trpcQuerier.state.usNe.getCheckIn.queryOptions({
      pseudonymizedId: resident.pseudonymizedId,
    }),
  );

  return new UsNeTodosPresenter(
    resident,
    stateData,
    opportunities,
    newDataFlag,
    firebaseAuthClient,
    userStore,
    checkInFormQuery,
    !!usNeCheckInTool,
  );
}

// We don't block rendering while hydrating the Reentry Assessment, because in most
// cases (people without an assessment) hydration won't change anything. Right now
// hydration literally can't fail, so `failed` is just a passthrough too.
const TodosHydrator: React.FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => (
  <HydratorWithDirectHydration hydratable={hydratable} failed={children}>
    {children}
  </HydratorWithDirectHydration>
);

const UsNeTodosInner = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
  HydratorComponent: TodosHydrator,
});

// This final wrapper component handles hydration of the person's Check-In Form data
// and displays a component allowing for a retry if there is an error
export const UsNeTodos = function UsNeTodos() {
  const { t } = useUsNeTranslations();
  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.home.todos.sectionTitle)}
      </HomepageSectionHeading>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} fallback={UsNeTodosError}>
            <Suspense fallback={<UsNeTodosLoading />}>
              <UsNeTodosInner />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </section>
  );
};
