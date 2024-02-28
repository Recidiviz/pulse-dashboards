// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { Navigate } from "react-router-dom";

import { ErrorMessage } from "../../components/StatusMessage";
import { useRootStore } from "../../components/StoreProvider";
import { outliersUrl } from "../views";

export const OutliersSupervisionHome = observer(
  function OutliersSupervisionHome() {
    const {
      outliersStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    if (supervisionStore.userCanAccessAllSupervisors) {
      return <Navigate to={outliersUrl("supervisionSupervisorsList")} />;
    }

    if (supervisionStore.currentSupervisorUser) {
      return (
        <Navigate
          replace
          to={outliersUrl("supervisionSupervisor", {
            supervisorPseudoId:
              supervisionStore.currentSupervisorUser.pseudonymizedId,
          })}
        />
      );
    }

    return <ErrorMessage />;
  },
);
