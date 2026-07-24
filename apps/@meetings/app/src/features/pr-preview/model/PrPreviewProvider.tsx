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

import { createContext, useContext } from "react";

import { usePrPreview } from "./usePrPreview";

interface PrPreviewContextValue {
  activeChannel: string | null;
  exitPreview: () => Promise<void>;
  promptExitPreview: () => void;
  isExiting: boolean;
}

// Safe no-op default so consumers render fine without a provider (e.g. tests
// that mount MobileHeader in isolation).
const defaultValue: PrPreviewContextValue = {
  activeChannel: null,
  exitPreview: async () => undefined,
  promptExitPreview: () => undefined,
  isExiting: false,
};

const PrPreviewContext = createContext<PrPreviewContextValue>(defaultValue);

// Mounts the single app-wide usePrPreview() instance. Stacked screens read
// from this context instead of each running their own hook instance, which
// would otherwise race each other on QR scans and update calls.
export const PrPreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const value = usePrPreview();
  return (
    <PrPreviewContext.Provider value={value}>
      {children}
    </PrPreviewContext.Provider>
  );
};

export function usePrPreviewContext() {
  return useContext(PrPreviewContext);
}
