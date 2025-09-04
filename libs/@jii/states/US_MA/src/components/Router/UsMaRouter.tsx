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
import { EGT } from "~@jii/paths";

import { EGTDataRouteContext } from "../EGTDataContext/RouteContext";
import { PageDefinition } from "../pages/PageDefinition";
import { PageEGT } from "../pages/PageEGT";
import { PageIntro } from "../pages/PageIntro";
import { PageMonthlyReport } from "../pages/PageMonthlyReport";
import { PageUsMaResidentHome } from "../pages/PageUsMaResidentHome";

export const UsMaRouter = () => {
  return (
    <Routes>
      <Route index element={<PageUsMaResidentHome />} />
      <Route path={EGT.path} element={<EGTDataRouteContext />}>
        <Route index element={<PageEGT />} />
        <Route path={EGT.Intro.path} element={<PageIntro />} />
        <Route path={EGT.Definition.path} element={<PageDefinition />} />
        <Route path={EGT.MonthlyReport.path} element={<PageMonthlyReport />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
