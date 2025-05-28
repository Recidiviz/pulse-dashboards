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
import { FC, ReactNode } from "react";

import { useSingleResidentContext } from "../../../../components/SingleResidentHydrator/context";
import { EGTDataContextProvider } from "./context";

/**
 * Provides a context with resident metadata narrowed to a type that supports EGT features.
 * Consume this context with `useEGTDataContext()`
 */
export const EGTDataContext: FC<{ children: ReactNode }> = observer(
  function EGTDataContext({ children }) {
    const {
      resident: { metadata },
    } = useSingleResidentContext();

    const data = metadata?.stateCode === "US_MA" ? metadata : undefined;

    if (!data) {
      throw new Error("Unexpected metadata format");
    }

    return (
      <EGTDataContextProvider
        value={{
          data,
        }}
      >
        {children}
      </EGTDataContextProvider>
    );
  },
);
