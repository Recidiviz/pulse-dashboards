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
import { Eligibility, Progress } from "~@jii/paths";

import { EligibilityRouteContext } from "../EligibilityRouteContext/EligibilityRouteContext";
import { PageEligibilityHome } from "../pages/PageEligibilityHome";
import { PageOpportunityComparison } from "../pages/PageOpportunityComparison";
import { PageOpportunityEligibility } from "../pages/PageOpportunityEligibility";
import { PageOpportunityEligibilityHome } from "../pages/PageOpportunityEligibilityHome";
import { PageOpportunityInfo } from "../pages/PageOpportunityInfo";
import { PageProgressInfoPage } from "../pages/PageProgressInfoPage";
import { PageSingleResidentHome } from "../pages/PageSingleResidentHome";

export function UsMeRouter() {
  return (
    <Routes>
      <Route index element={<PageSingleResidentHome />} />
      <Route path={Eligibility.path} element={<EligibilityRouteContext />}>
        <Route index element={<PageEligibilityHome />} />
        <Route
          path={Eligibility.Opportunity.path}
          element={<PageOpportunityEligibility />}
        >
          <Route index element={<PageOpportunityEligibilityHome />} />
          <Route
            path={Eligibility.Opportunity.InfoPage.path}
            element={<PageOpportunityInfo />}
          />
        </Route>
        <Route
          path={Eligibility.Comparison.path}
          element={<PageOpportunityComparison />}
        />
      </Route>
      <Route path={Progress.InfoPage.path} element={<PageProgressInfoPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
