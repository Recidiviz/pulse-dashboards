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

"use client";

import { Box, CircularProgress } from "@mui/material";

import { PasswordGate } from "./components/PasswordGate";
import { useConfigAccess } from "./hooks/useConfigAccess";

/**
 * Layout for all /config routes.
 * Intercepts rendering to show the password gate when enabled.
 */
export default function ConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isGateEnabled, isUnlocked, error, verifyPassword } =
    useConfigAccess();

  // Still checking gate status
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        className="bg-gray-50"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Gate is enabled and user hasn't unlocked yet
  if (isGateEnabled && !isUnlocked) {
    return <PasswordGate error={error} onSubmit={verifyPassword} />;
  }

  // Access granted - render the config page
  return <>{children}</>;
}
