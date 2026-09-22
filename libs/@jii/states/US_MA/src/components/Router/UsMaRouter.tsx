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
import { useSingleResidentContext } from "~@jii/data";
import { EGT, ProgramCatalog, UsMaReentry } from "~@jii/paths";

import { EGTDataRouteContext } from "../EGTDataContext/RouteContext";
import { PageDefinition } from "../pages/PageDefinition";
import { PageEGT } from "../pages/PageEGT";
import { PageIntro } from "../pages/PageIntro";
import { PageMonthlyReport } from "../pages/PageMonthlyReport";
import { PageUsMaProgramCatalog } from "../pages/PageUsMaProgramCatalog";
import { PageUsMaReentryChecklist } from "../pages/PageUsMaReentryChecklist";
import { PageUsMaReentryGuide } from "../pages/PageUsMaReentryGuide";
import { PageUsMaReentryOverview } from "../pages/PageUsMaReentryOverview";
import { PageUsMaReentryQuestionnaire } from "../pages/PageUsMaReentryQuestionnaire";
import { PageUsMaResidentHome } from "../pages/PageUsMaResidentHome";
import { PageUsMaResourceDetail } from "../pages/PageUsMaResourceDetail";
import { PageUsMaResourceList } from "../pages/PageUsMaResourceList";
import { UsMaReentryLayout } from "../Reentry/UsMaReentryLayout";

export const UsMaRouter = () => {
  const { residentFlags } = useSingleResidentContext();

  return (
    <Routes>
      <Route index element={<PageUsMaResidentHome />} />
      <Route path={EGT.path} element={<EGTDataRouteContext />}>
        <Route index element={<PageEGT />} />
        <Route path={EGT.Intro.path} element={<PageIntro />} />
        <Route path={EGT.Definition.path} element={<PageDefinition />} />
        <Route path={EGT.MonthlyReport.path} element={<PageMonthlyReport />} />
      </Route>
      <Route path={ProgramCatalog.path} element={<PageUsMaProgramCatalog />} />
      {residentFlags.usMaReentry && (
        <>
          <Route path={UsMaReentry.path} element={<UsMaReentryLayout />}>
            <Route index element={<PageUsMaReentryOverview />} />
            <Route
              path={UsMaReentry.Checklist.path}
              element={<PageUsMaReentryChecklist />}
            />
            <Route
              path={UsMaReentry.Guide.path}
              element={<PageUsMaReentryGuide />}
            />
            <Route
              path={UsMaReentry.Resources.CategoryResults.path}
              element={<PageUsMaResourceList />}
            />
            <Route
              path={UsMaReentry.Resources.CategoryResults.Detail.path}
              element={<PageUsMaResourceDetail />}
            />
          </Route>
          {/* Sibling route, since it has its own separate full-screen layout */}
          <Route
            path={UsMaReentry.Questionnaire.path}
            element={<PageUsMaReentryQuestionnaire />}
          />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
