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

import { useContext } from "react";

import type { ResidentsStore } from "../../datastores/ResidentsStore";
import { StoreContext } from "./StoreContext";

export function useResidentsStore(): ResidentsStore {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useResidentsStore must be used within a StoreProvider");
  }
  const store = context.store.residentsStore;

  if (!store) {
    throw new Error(
      "a ResidentsStore must be initialized before calling useResidentsStore",
    );
  }
  return store;
}
