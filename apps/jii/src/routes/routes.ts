// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { route, string, types } from "react-router-typesafe-routes/dom";

export const EmailVerification = route("verify");

export const AfterLogin = route("after-login");

export const ReturnToPathFragment = route("", {
  searchParams: { returnToPath: string() },
});

export const State = route(":stateSlug", types(ReturnToPathFragment), {
  Eligibility: route(
    "eligibility",
    {},
    {
      Search: route("search"),
      Opportunity: route(
        ":opportunitySlug",
        {},
        {
          About: route("about"),
          Requirements: route("requirements"),
          NextSteps: route("next-steps"),
        },
      ),
    },
  ),
});

export const SiteRoot = route("", types(ReturnToPathFragment));
