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
import { FC, ReactNode } from "react";

import { useRootStore } from "~@jii/data";
import {
  Hydratable,
  HydratorWithErrorLogging,
  withPresenterManager,
} from "~hydration-utils";

import { UsCoProgramsPresenter } from "../presenters/UsCoProgramsPresenter";

const ManagedComponent: FC<{ presenter: UsCoProgramsPresenter }> = observer(
  function UsCoProgramsList({ presenter }) {
    return (
      <div>
        <h2>Colorado Programs</h2>
        <ul>
          {presenter.programs?.map((program) => (
            <li key={program.programId}>{program.title}</li>
          ))}
        </ul>
      </div>
    );
  },
);

const FallbackComponent = ({ error }: { error: Error }) => {
  return <div>Error loading programs: {error.message}</div>;
};

const ProgramsHydrator: FC<{
  children: ReactNode;
  hydratable: Hydratable;
}> = ({ children, hydratable }) => {
  return (
    <HydratorWithErrorLogging
      hydratable={hydratable}
      fallback={FallbackComponent}
    >
      {children}
    </HydratorWithErrorLogging>
  );
};

function usePresenter() {
  const rootStore = useRootStore();
  return new UsCoProgramsPresenter(rootStore);
}

export const UsCoProgramsList = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: ProgramsHydrator,
});
