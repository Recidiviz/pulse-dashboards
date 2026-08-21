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

import { useSearchParams } from "react-router-dom";

import { State } from "~@jii/paths";

import { BackLink, Chevron } from "./BackButton.styles";

export function BackButton() {
  const [searchParams] = useSearchParams();
  const { backTarget } =
    State.Resident.ResourceExplorer.CategoryResults.Detail.getTypedSearchParams(
      searchParams,
    );
  // Reject non-internal paths to prevent malformed/malicious URLs from being used
  const safePath = backTarget?.startsWith("/") ? backTarget : null;

  return (
    <BackLink to={safePath ?? ".."}>
      <Chevron size={16} rotate={180} aria-hidden />
      Back
    </BackLink>
  );
}
