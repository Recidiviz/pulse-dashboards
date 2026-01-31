// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { FC } from "react";
import { Outlet } from "react-router-dom";

import { NotFound } from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { MainContentHydrator } from "~@jii/layout";
import { withPresenterManager } from "~hydration-utils";

import { UsNcRNAFormContextPresenter } from "./UsNcRNAFormContextPresenter";
import { UsNcRNAFormContextProvider } from "./UsNcRNAFormContextProvider";

/**
 * Provides an RNA Form object to RNA-related pages in the route's children.
 * Consume this context with `useRNAFormDataContext()`
 */
const ManagedComponent: FC<{
  presenter: UsNcRNAFormContextPresenter;
}> = observer(function UsNcRNAFormContext({ presenter }) {
  const { form } = presenter;

  if (!form) {
    return <NotFound />;
  }
  return (
    <UsNcRNAFormContextProvider value={{ form }}>
      <Outlet />
    </UsNcRNAFormContextProvider>
  );
});

function usePresenter() {
  const { apiClient } = useRootStore();
  const { resident } = useSingleResidentContext();
  return new UsNcRNAFormContextPresenter(apiClient, resident.pseudonymizedId);
}

export const UsNcRNAFormContext = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
  HydratorComponent: MainContentHydrator,
});
