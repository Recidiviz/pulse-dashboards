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

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { AllResidentModalView } from "./types";

type AllCaseloadsModalContextType = {
  currentView: AllResidentModalView;
  setCurrentView: (view: AllResidentModalView) => void;
};

export const AllCaseloadsModalContext = createContext<
  AllCaseloadsModalContextType | undefined
>(undefined);

export const AllCaseloadsModalProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [currentView, setCurrentView] =
    useState<AllResidentModalView>("OVERVIEW");

  const value = useMemo(() => ({ currentView, setCurrentView }), [currentView]);

  return (
    <AllCaseloadsModalContext.Provider value={value}>
      {children}
    </AllCaseloadsModalContext.Provider>
  );
};

export function useAllCaseloadsModalContext() {
  const context = useContext(AllCaseloadsModalContext);

  if (context === undefined) {
    throw new Error(
      "useAllCaseloadsModalContext must be used within an AllCaseloadsModalProvider",
    );
  }
  return context;
}
