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

import { Route, Routes } from "react-router-dom";

import { NotFound } from "~@jii/common-ui";
import { UsAzMoreInformation } from "~@jii/paths";

import { PageIntro } from "../pages/PageIntro";
import { PageMoreInfoAbout } from "../pages/PageMoreInfoAbout";
import { PageMoreInfoImportantDates } from "../pages/PageMoreInfoImportantDates";
import { PageUsAzResidentHome } from "../pages/PageUsAzSingleResidentHome";

export function UsAzRouter() {
  return (
    <div>
      <Routes>
        <Route index element={<PageUsAzResidentHome />} />
        <Route path={UsAzMoreInformation.Intro.path} element={<PageIntro />} />
        <Route
          path={UsAzMoreInformation.ImportantDates.path}
          element={<PageMoreInfoImportantDates />}
        />
        <Route
          path={UsAzMoreInformation.About.path}
          element={<PageMoreInfoAbout />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
