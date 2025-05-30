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

import { createContext } from "react";

import { UsMaResidentMetadata } from "~datatypes";

import { useRequiredContext } from "../../../../utils/useRequiredContext";
import { UsMaEgtCopy } from "../../configs/US_MA/copy";

export type EGTDataContext = {
  // this is not currently state agnostic, but for now we only have one state.
  // as that changes we expect this to evolve somehow
  data: UsMaResidentMetadata;
  copy: UsMaEgtCopy;
};

const context = createContext<EGTDataContext | undefined>(undefined);

export const EGTDataContextProvider = context.Provider;

export function useEGTDataContext() {
  return useRequiredContext(context);
}
