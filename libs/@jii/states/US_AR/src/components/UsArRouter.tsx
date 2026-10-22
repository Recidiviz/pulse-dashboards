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

import { Route, Routes } from "react-router-dom";

import { NotFound } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { ProgramCatalog, UsArMoreInformation } from "~@jii/paths";

import { PageMoreInformationImportantDates } from "./PageMoreInformationImportantDates";
import { PROGRAMS_NAV_BAR_HEIGHT } from "./Programs/ProgramsNavBar/ProgramsNavBar.styles";
import { UsArProgramCatalog } from "./Programs/UsArProgramCatalog";
import { UsArProgramsLayout } from "./Programs/UsArProgramsLayout";
import { UsArSingleResidentHome } from "./UsArSingleResidentHome";

export function UsArRouter() {
  const { residentFlags } = useSingleResidentContext();
  return (
    <Routes>
      <Route index element={<UsArSingleResidentHome />} />
      <Route path={UsArMoreInformation.path}>
        <Route
          path={UsArMoreInformation.ImportantDates.path}
          element={<PageMoreInformationImportantDates />}
        />
      </Route>
      {residentFlags.usArEdovoCredits ? (
        <Route path={ProgramCatalog.path} element={<UsArProgramsLayout />}>
          <Route
            index
            element={
              <UsArProgramCatalog
                bannerStickyOffset={PROGRAMS_NAV_BAR_HEIGHT}
              />
            }
          />
          {/* TODO(JII2-118): replace the placeholder with the On my tablet page */}
          <Route
            path={ProgramCatalog.OnMyTablet.path}
            element={<div>On my tablet</div>}
          />
        </Route>
      ) : (
        <Route path={ProgramCatalog.path} element={<UsArProgramCatalog />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
