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
import { UsNcRNA } from "~@jii/paths";

import { UsNcRNAFormContext } from "./UsNcRNA/UsNcRNAFormContext/UsNcRNAFormContext";
import { UsNcRNAFormPage } from "./UsNcRNA/UsNcRNAFormPage/UsNcRNAFormPage";
import { UsNcRNAConfirmIdentity } from "./UsNcRNA/UsNcRNALanding/UsNcRNAConfirmIdentity";
import { UsNcRNALanding } from "./UsNcRNA/UsNcRNALanding/UsNcRNALanding";
import { UsNcSingleResidentHome } from "./UsNcSingleResidentHome";

export function UsNcRouter() {
  return (
    <Routes>
      <Route index element={<UsNcSingleResidentHome />} />
      <Route path={UsNcRNA.path} element={<UsNcRNAFormContext />}>
        <Route path={UsNcRNA.Landing.path} element={<UsNcRNALanding />} />
        <Route
          path={UsNcRNA.ConfirmIdentity.path}
          element={<UsNcRNAConfirmIdentity />}
        />
        <Route path={UsNcRNA.FormPage.path} element={<UsNcRNAFormPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
