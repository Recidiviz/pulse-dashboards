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

import React, { createContext, useContext, useState } from "react";

const IntakeAuthContext = createContext<{
  token: string | null;
  setToken: (token: string | null) => void;
  clientId: string | null;
  setClientId: (clientId: string | null) => void;
  stateCode: string | null;
  setStateCode: (stateCode: string | null) => void;
}>({
  token: null,
  setToken: () => null,
  clientId: null,
  setClientId: () => null,
  stateCode: null,
  setStateCode: () => null,
});

export const useIntakeAuthContext = () => {
  const context = useContext(IntakeAuthContext);
  if (!context) {
    throw new Error(
      "useIntakeAuthContext must be used within an IntakeAuthProvider",
    );
  }
  return context;
};

export const IntakeAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState<string | null>(null);

  return (
    <IntakeAuthContext.Provider
      value={{
        token,
        setToken,
        clientId,
        setClientId,
        stateCode,
        setStateCode,
      }}
    >
      {children}
    </IntakeAuthContext.Provider>
  );
};
