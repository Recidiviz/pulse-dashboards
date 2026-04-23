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

import React, { createContext, useContext } from "react";

import type { AgencyConfig } from "~@meetings/config";

import ConfigErrorScreen from "../screens/ConfigErrorScreen";
import { trpc } from "../trpc/client";

interface AgencyConfigContextType {
  agencyConfigs: Record<string, AgencyConfig>;
  isLoading: boolean;
}

const AgencyConfigContext = createContext<AgencyConfigContextType | undefined>(
  undefined,
);

export const AgencyConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    data: agencyConfigs = {},
    isLoading,
    isError,
    refetch,
  } = trpc.v1.config.getAll.useQuery();

  if (isError) {
    return <ConfigErrorScreen onRetry={() => void refetch()} />;
  }

  return (
    <AgencyConfigContext.Provider value={{ agencyConfigs, isLoading }}>
      {children}
    </AgencyConfigContext.Provider>
  );
};

export const useAgencyConfigs = () => {
  const context = useContext(AgencyConfigContext);
  if (context === undefined) {
    throw new Error(
      "useAgencyConfigs must be used within an AgencyConfigProvider",
    );
  }
  return context;
};
