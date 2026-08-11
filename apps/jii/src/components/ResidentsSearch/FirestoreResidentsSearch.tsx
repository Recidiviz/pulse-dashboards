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

import { observer } from "mobx-react-lite";
import { FC } from "react";

import { useResidentsContext, useRootStore } from "~@jii/data";
import { MainContentHydratorWithErrorLogging } from "~@jii/layout";
import { withPresenterManager } from "~hydration-utils";

import { FirestoreResidentsSearchPresenter } from "./FirestoreResidentsSearchPresenter";
import { ResidentSearchWithPresenter } from "./ResidentSearchWithPresenter";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

// to support the tRPC migration there are two layers of presenters required here;
// this component is approaching deprecation anyway so this is just a temporary measure

// the inner component is responsible for supplying Firestore-derived input
// to the datasource-agnostic search component. We can't instantiate the presenter until
// after hydration, which is why this two-component design is necessary. This component
// will only be rendered after successful hydration.

function useInnerPresenter({
  facilities,
}: {
  facilities: FirestoreResidentsSearchPresenter["facilities"];
}) {
  const { uiStore, userStore } = useRootStore();
  const { residentsStore } = useResidentsContext();
  return new ResidentsSearchPresenter(
    facilities,
    residentsStore,
    uiStore,
    userStore,
  );
}

const InnerManagedComponent: FC<{
  presenter: ResidentsSearchPresenter;
}> = observer(function ResidentSearchManager({ presenter }) {
  return <ResidentSearchWithPresenter presenter={presenter} />;
});

const ResidentSearchManager = withPresenterManager({
  usePresenter: useInnerPresenter,
  ManagedComponent: InnerManagedComponent,
  managerIsObserver: true,
});

// the outer component manages the hydration flow via Firestore

function useOuterPresenter() {
  const { residentsStore } = useResidentsContext();

  return new FirestoreResidentsSearchPresenter(residentsStore);
}

const OuterManagedComponent: FC<{
  presenter: FirestoreResidentsSearchPresenter;
}> = observer(function HydratableResidentsSearch({ presenter }) {
  return <ResidentSearchManager facilities={presenter.facilities} />;
});

export const FirestoreResidentsSearch = withPresenterManager({
  usePresenter: useOuterPresenter,
  managerIsObserver: false,
  ManagedComponent: OuterManagedComponent,
  HydratorComponent: MainContentHydratorWithErrorLogging,
});
