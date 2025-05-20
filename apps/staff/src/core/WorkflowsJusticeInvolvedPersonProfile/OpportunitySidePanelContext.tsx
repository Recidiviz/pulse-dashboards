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

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import {
  OPPORTUNITY_SIDE_PANEL_VIEW,
  OpportunitySidePanelContextType,
} from "../OpportunityCaseloadView/types";

export const OpportunitySidePanelContext = createContext<
  OpportunitySidePanelContextType | undefined
>(undefined);

export const OpportunitySidePanelProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [currentView, setCurrentView] = useState<OPPORTUNITY_SIDE_PANEL_VIEW>(
    "OPPORTUNITY_PREVIEW",
  );

  const value = useMemo(() => ({ currentView, setCurrentView }), [currentView]);

  return (
    <OpportunitySidePanelContext.Provider value={value}>
      {children}
    </OpportunitySidePanelContext.Provider>
  );
};

export function useOpportunitySidePanel() {
  const context = useContext(OpportunitySidePanelContext);

  if (context === undefined) {
    throw new Error(
      "useOpportunitySidePanel must be used within an OpportunitySidePanelProvider",
    );
  }
  return context;
}
