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

import { RulesTestEnvironment } from "@firebase/rules-unit-testing";

export function getStatelessUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@stateless.com", { app: "staff" });
}

export function getTNUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_tn.gov", {
    app: "staff",
    stateCode: "US_TN",
    impersonator: false,
    recidivizAllowedStates: [],
  });
}

export function getNDUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_nd.gov", {
    app: "staff",
    stateCode: "US_ND",
    impersonator: false,
    recidivizAllowedStates: [],
  });
}

export function getRecidivizUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("admin", {
    app: "staff",
    stateCode: "RECIDIVIZ",
    impersonator: false,
    recidivizAllowedStates: ["US_TN", "US_ND"],
  });
}

export function getImpersonatedUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_tn.gov", {
    app: "staff",
    stateCode: "US_TN",
    impersonator: true,
    recidivizAllowedStates: [],
  });
}
