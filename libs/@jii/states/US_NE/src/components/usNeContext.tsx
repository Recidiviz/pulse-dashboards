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
import { createContext } from "react";

import { useSingleResidentContext } from "~@jii/data";
import { UsNeResidentMetadata } from "~datatypes";
import { useRequiredContext } from "~utils";

import { UsNeCopy, usNeCopy } from "../configs/copy";

export type UsNeContextValue = {
  metadata: UsNeResidentMetadata;
  copy: UsNeCopy;
};

const context = createContext<UsNeContextValue | undefined>(undefined);

const { Provider } = context;

export function useUsNeContext() {
  return useRequiredContext(context);
}

export const UsNeContextProvider: React.FC<{ children: React.ReactNode }> =
  observer(function UsNeContextProvider({ children }) {
    const {
      resident: { metadata },
    } = useSingleResidentContext();

    if (metadata.stateCode !== "US_NE") {
      throw new Error("Unexpected metadata format");
    }

    return <Provider value={{ metadata, copy: usNeCopy }}>{children}</Provider>;
  });
