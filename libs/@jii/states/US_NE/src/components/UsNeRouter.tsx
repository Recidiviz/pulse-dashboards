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
import { EGT, UsNeReentryChecklist } from "~@jii/paths";

import { Definition } from "./Definition/Definition";
import UsNeSingleResidentHome from "./Home/UsNeSingleResidentHome";
import UsNeReentryChecklistPage from "./ReentryChecklist/UsNeReentryChecklistPage";
import { UsNeContextProvider } from "./usNeContext";

export const UsNeRouter = () => {
  return (
    <UsNeContextProvider>
      <Routes>
        <Route index element={<UsNeSingleResidentHome />} />
        <Route path={EGT.Definition.path} element={<Definition />} />
        <Route
          path={UsNeReentryChecklist.path}
          element={<UsNeReentryChecklistPage />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UsNeContextProvider>
  );
};
