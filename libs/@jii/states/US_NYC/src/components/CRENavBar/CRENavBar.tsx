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

import { useMatch } from "react-router-dom";

import { Wordmark } from "~@jii/layout";
import { State } from "~@jii/paths";

import { BackButton } from "../BackButton/BackButton";
import { NavBar } from "./CRENavBar.styles";

export function CRENavBar() {
  const isCategoryRoute = useMatch({
    path: State.Resident.ResourceExplorer.CategoryResults.path,
    end: false,
  });
  return (
    <NavBar aria-label="Community Resources Navigation Bar">
      {isCategoryRoute ? <BackButton /> : <Wordmark />}
    </NavBar>
  );
}
