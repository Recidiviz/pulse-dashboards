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

const cookieName = (clientId: string) => `auth0.${clientId}.is.authenticated`;

export function hasPriorAuth0Session(clientId: string): boolean {
  const name = cookieName(clientId);

  return document.cookie.split(";").some((cookie) => {
    const [cookieKey, value] = cookie.split("=").map((part) => part.trim());
    return cookieKey === name && value === "true";
  });
}
