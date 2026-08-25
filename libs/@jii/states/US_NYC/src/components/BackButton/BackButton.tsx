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

import { useMatch, useSearchParams } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";

import { BackLink, Chevron } from "./BackButton.styles";

// TODO(OBT-45888): BackButton uses useMatch to identify the current page because
// the layout's RouteContext.matches doesn't include child route matches — they're
// only visible inside <Outlet>. Find a cleaner approach that doesn't require the
// back button to know about route structure explicitly.

const { ResourceExplorer } = State.Resident;
const { CategoryResults } = ResourceExplorer;
const { Detail } = CategoryResults;

export function BackButton() {
  const [searchParams] = useSearchParams();
  const residentParams = useTypedParams(State.Resident);
  const { backTarget } = Detail.getTypedSearchParams(searchParams);

  // Reject non-internal paths to prevent malformed/malicious URLs from being used
  const safePath = backTarget?.startsWith("/") ? backTarget : null;

  const detailMatch = useMatch(Detail.path);
  const categoryMatch = useMatch(CategoryResults.path);

  let fallback = ResourceExplorer.buildPath(residentParams);
  if (detailMatch?.params.category) {
    // Resource detail page: back goes to the category results list
    fallback = CategoryResults.buildPath({
      ...residentParams,
      category: detailMatch.params.category,
    });
  } else if (categoryMatch) {
    // Category results page: back goes to the CRE landing
    fallback = ResourceExplorer.buildPath(residentParams);
  }

  return (
    <BackLink to={safePath ?? fallback}>
      <Chevron size={16} rotate={180} aria-hidden />
      Back
    </BackLink>
  );
}
