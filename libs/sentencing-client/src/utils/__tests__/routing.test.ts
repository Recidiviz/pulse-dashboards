// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { psiRoute, psiUrl } from "../routing";

test("psiRoute returns the relative route template string for a PSI page", () => {
  expect(psiRoute({ routeName: "psi" })).toBe("");
  expect(psiRoute({ routeName: "dashboard" })).toBe("/dashboard");
  expect(psiRoute({ routeName: "supervisorDashboard" })).toBe(
    "/dashboard/supervisor/:staffPseudoId",
  );
  expect(psiRoute({ routeName: "staffDashboard" })).toBe(
    "/dashboard/staff/:staffPseudoId",
  );
  expect(psiRoute({ routeName: "caseDetails" })).toBe(
    "/dashboard/staff/:staffPseudoId/case/:caseId",
  );
});

test("psiUrl returns the url route string for a PSI page", () => {
  expect(
    psiUrl("psi", {
      staffPseudoId: "123",
    }),
  ).toBe("/psi");
  expect(
    psiUrl("dashboard", {
      staffPseudoId: "123",
    }),
  ).toBe("/psi/dashboard");
  expect(
    psiUrl("supervisorDashboard", {
      staffPseudoId: "123",
    }),
  ).toBe("/psi/dashboard/supervisor/123");
  expect(
    psiUrl("staffDashboard", {
      staffPseudoId: "123",
    }),
  ).toBe("/psi/dashboard/staff/123");
  expect(
    psiUrl("caseDetails", {
      staffPseudoId: "123",
      caseId: "456",
    }),
  ).toBe("/psi/dashboard/staff/123/case/456");
});
