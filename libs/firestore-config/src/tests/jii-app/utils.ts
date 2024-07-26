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
  return testEnv.authenticatedContext("user@stateless.com", { app: "jii" });
}

export function getMEUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_me.gov", {
    app: "jii",
    stateCode: "US_ME",
    externalId: "user",
    recidivizAllowedStates: [],
    permissions: [],
  });
}

export function getEnhancedMEUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("enhanceduser@us_me.gov", {
    app: "jii",
    stateCode: "US_ME",
    recidivizAllowedStates: [],
    permissions: ["enhanced"],
  });
}

export function getRecidivizUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("admin", {
    app: "jii",
    stateCode: "RECIDIVIZ",
    recidivizAllowedStates: ["US_ME"],
    permissions: ["enhanced"],
  });
}

export function getXXUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_xx.gov", {
    app: "jii",
    stateCode: "US_XX",
    externalId: "user",
    recidivizAllowedStates: [],
    permissions: [],
  });
}
