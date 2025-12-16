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

"use client";

import React, { createContext, useContext, useMemo } from "react";

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

export interface AuthUserCapabilities {
  isZeroCaseloadUser: boolean;
  isReadOnlyUser: boolean;
  cpaClientLocations: string[];
}

const AuthUserCapabilitiesContext = createContext<AuthUserCapabilities>({
  isZeroCaseloadUser: false,
  isReadOnlyUser: false,
  cpaClientLocations: [],
});

export const AuthUserCapabilitiesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userAppMetadata } = useAuth();

  // Extract Auth0 feature variants
  const capabilities = useMemo<AuthUserCapabilities>(() => {
    // @ts-expect-error: featureVariants may not be defined in userAppMetadata
    const features = userAppMetadata?.featureVariants || {};

    // Extract all keys starting with CPA_LOCATION_
    const cpaClientLocations = Object.keys(features)
      .filter((key) => key.startsWith("CPA_LOCATION_"))
      .map((key) => key.replace("CPA_LOCATION_", ""));

    return {
      isZeroCaseloadUser: Boolean(features.zeroCaseloadUser),
      isReadOnlyUser: Boolean(features.readOnly),
      cpaClientLocations: cpaClientLocations,
    };
  }, [userAppMetadata]);

  return (
    <AuthUserCapabilitiesContext.Provider value={capabilities}>
      {children}
    </AuthUserCapabilitiesContext.Provider>
  );
};

export const useAuthUserCapabilities = () => {
  return useContext(AuthUserCapabilitiesContext);
};
