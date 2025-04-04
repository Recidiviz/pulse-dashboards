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

import { Supervisor } from "..";

export const SupervisorInfoFixture: Supervisor = {
  supervisorDashboardStats: {
    topLineStats: {
      casesDue: 12,
      teamUsageRate: 0.75,
      totalCaseCompletionRate: 0.85,
    },
    staffStats: [
      {
        caseCompletionRate: 0.9,
        activeCasesAssigned: 13,
        pseudonymizedId: "staff-pseudo-001",
        stateCode: "US_ND",
        fullName: "John Doe",
        hasLoggedIn: true,
        email: "staff.member@example.com",
        supervisorId: null,
      },
    ],
  },
  cases: [],
  pseudonymizedId: "pseudo-001",
  stateCode: "US_ND",
  fullName: "Jane Doe",
  hasLoggedIn: true,
  email: "jane.doe@example.com",
  supervisorId: null,
  externalId: undefined,
};
