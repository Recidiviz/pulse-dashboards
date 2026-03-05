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
import { createContext, FC } from "react";
import { Outlet } from "react-router-dom";

import { useResidentMetadata } from "~@jii/data";
import { ResidentMetadata } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";
import { useRequiredContext } from "~utils";

import { SingleResidentContextPresenter } from "./SingleResidentContextPresenter";

export type UsAzResidentContext = {
  isDprQualified: boolean;
  activeDates: SingleResidentContextPresenter["activeDates"];
  metadata: ResidentMetadata<"US_AZ">;
};

const context = createContext<UsAzResidentContext | undefined>(undefined);

function usePresenter() {
  const metadata = useResidentMetadata("US_AZ");
  return new SingleResidentContextPresenter(metadata);
}

const ManagedComponent: FC<{ presenter: SingleResidentContextPresenter }> =
  observer(function SingleResidentContextProvider({ presenter }) {
    return (
      <context.Provider
        value={{
          isDprQualified: presenter.isDprQualified,
          metadata: presenter.metadata,
          activeDates: presenter.activeDates,
        }}
      >
        <Outlet />
      </context.Provider>
    );
  });

export const UsAzSingleResidentContextRoute = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});

export function useUsAzSingleResidentContext() {
  return useRequiredContext(context);
}
