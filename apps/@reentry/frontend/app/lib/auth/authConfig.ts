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

import type { AuthSettings } from "@recidiviz/auth";

/**
 * Routes that don't require Auth0 authentication.
 * These routes will not trigger an Auth0 redirect when accessed.
 */
export const PUBLIC_ROUTES = ["/auth/callback", "/assessment"];

/**
 * Check if the given pathname is a public route that doesn't require Auth0 auth.
 */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};

export const getAuthSettings = (): AuthSettings => {
  if (
    !process.env["NEXT_PUBLIC_AUTH0_DOMAIN"] ||
    !process.env["NEXT_PUBLIC_AUTH0_CLIENT_ID"] ||
    !process.env["NEXT_PUBLIC_AUTH0_AUDIENCE"]
  ) {
    throw new Error("Required environment variables for Auth0 are missing");
  }

  const settings: AuthSettings = {
    domain: process.env["NEXT_PUBLIC_AUTH0_DOMAIN"],
    client_id: process.env["NEXT_PUBLIC_AUTH0_CLIENT_ID"],
    redirect_uri:
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3000/auth/callback",
    useRefreshTokens: true,
    cacheLocation: "localstorage",
    scope:
      "openid profile email read:users read:current_user read:user_idp_tokens",
    audience: process.env["NEXT_PUBLIC_AUTH0_AUDIENCE"],
  };

  return settings;
};
