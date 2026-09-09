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

import { createContext, ReactNode, useState } from "react";

import { useRequiredContext } from "~utils";

export type BackTargetContextValue = {
  backTarget: string | null;
  setBackTarget: (path: string | null) => void;
};

const BackTargetContext = createContext<BackTargetContextValue | undefined>(
  undefined,
);

export function BackTargetProvider({ children }: { children: ReactNode }) {
  const [backTarget, setBackTarget] = useState<string | null>(null);

  return (
    <BackTargetContext.Provider value={{ backTarget, setBackTarget }}>
      {children}
    </BackTargetContext.Provider>
  );
}

export function useBackTargetContext(): BackTargetContextValue {
  return useRequiredContext(
    BackTargetContext,
    "useBackTarget must be used within a BackTargetProvider",
  );
}
