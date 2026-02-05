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
import { rem } from "polished";
import { FC } from "react";

import { TAILWIND_WRAPPER_CLASS } from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { MainContentHydrator, PAGE_LAYOUT_HEADER_GAP } from "~@jii/layout";
import {
  IntakeRouter,
  IntakeSocketProvider,
  QueryProvider,
} from "~@reentry/frontend-shared";
import { withPresenterManager } from "~hydration-utils";

import { IntakeIntegrationProvider } from "../IntakeIntegrationProvider/IntakeIntegrationProvider";
import { IntakeAssessmentPresenter } from "./IntakeAssessmentPresenter";

const ManagedComponent: FC<{ presenter: IntakeAssessmentPresenter }> = observer(
  function IntakeAssessment({ presenter }) {
    return (
      <IntakeIntegrationProvider>
        <QueryProvider>
          <div
            className={TAILWIND_WRAPPER_CLASS}
            style={{
              height: `calc(100vh - ${useRootStore().uiStore.stickyHeaderHeight}px - ${rem(PAGE_LAYOUT_HEADER_GAP)})`,
            }}
          >
            {presenter.isAuthorized ? (
              <IntakeSocketProvider>
                <IntakeRouter />
              </IntakeSocketProvider>
            ) : (
              <div>{presenter.userFacingErrorMessage}</div>
            )}
          </div>
        </QueryProvider>
      </IntakeIntegrationProvider>
    );
  },
);

function usePresenter() {
  const { firebaseAuthClient, userStore } = useRootStore();
  const { resident } = useSingleResidentContext();

  return new IntakeAssessmentPresenter(firebaseAuthClient, userStore, resident);
}

export const IntakeAssessment = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
  HydratorComponent: MainContentHydrator,
});
