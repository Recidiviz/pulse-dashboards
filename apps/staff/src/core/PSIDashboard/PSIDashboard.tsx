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

import { useRootStore } from "../../components/StoreProvider";
import { PSIStaffPresenter } from "../../PSIStore/presenters/PSIStaffPresenter";
import ModelHydrator from "../ModelHydrator";

const PSIDashboardWithPresenter = observer(function PSIDashboard({
  presenter,
}: {
  presenter: PSIStaffPresenter;
}) {
  const { staffInfo } = presenter;
  return <>{JSON.stringify(staffInfo)}</>;
});

export const PSIDashboard: React.FC = observer(function PSIDashboard() {
  const {
    psiStore: { psiStaffStore },
  } = useRootStore();

  const presenter = new PSIStaffPresenter(psiStaffStore);

  return (
    <ModelHydrator model={presenter}>
      <PSIDashboardWithPresenter presenter={presenter} />
    </ModelHydrator>
  );
});
