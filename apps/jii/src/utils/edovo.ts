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

import { matchPath } from "react-router-dom";

import { EdovoLandingPage } from "../routes/routes";

// we run under a custom edovo subdomain to pass through network filters
export function isEdovoSubdomain() {
  return window.location.hostname.endsWith(".edovo.com");
}

export function isEdovoEnv(): boolean {
  if (isEdovoSubdomain()) return true;
  // testing environments may not iframe the custom domain URL
  if (
    window.parent !== window.top &&
    // could be various domains under edovo.com or tedovo.com
    window.parent.location.hostname.endsWith("edovo.com")
  )
    return true;
  // force the value if we are currently on the edovo landing page
  if (matchPath(EdovoLandingPage.path, window.location.pathname)) return true;

  return false;
}
