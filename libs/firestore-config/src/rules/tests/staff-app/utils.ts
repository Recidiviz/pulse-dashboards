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

export function getImpersonatedUserInProd(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_tn.gov", {
    app: "staff",
    stateCode: "US_TN",
    impersonator: true,
    recidivizAllowedStates: [],
    environment: "production",
  });
}

export function getImpersonatedUserInStaging(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_tn.gov", {
    app: "staff",
    stateCode: "US_TN",
    impersonator: true,
    recidivizAllowedStates: [],
    environment: "staging",
  });
}

export function getDemoOnlyUser(
  testEnv: RulesTestEnvironment,
  stateCode: string,
) {
  return testEnv.authenticatedContext(
    `user@${stateCode.toLocaleLowerCase()}.gov`,
    {
      app: "staff",
      stateCode,
      impersonator: false,
      recidivizAllowedStates: [],
      forceWorkflowsDemoData: true,
    },
  );
}

/** A CO user whose token lacks the Parole Board access claim. */
export function getCOUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_co.gov", {
    app: "staff",
    stateCode: "US_CO",
    impersonator: false,
    recidivizAllowedStates: [],
  });
}

/** A CO user whose token carries the Parole Board access claim. */
export function getCOParoleBoardUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("paroleboard@us_co.gov", {
    app: "staff",
    stateCode: "US_CO",
    impersonator: false,
    recidivizAllowedStates: [],
    hasParoleBoardAccess: true,
  });
}

/** A demo-only CO user whose token carries the Parole Board access claim. */
export function getDemoOnlyCOParoleBoardUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("paroleboard@us_co.gov", {
    app: "staff",
    stateCode: "US_CO",
    impersonator: false,
    recidivizAllowedStates: [],
    forceWorkflowsDemoData: true,
    hasParoleBoardAccess: true,
  });
}

/** A US_ID staff user whose token lacks the Parole Board access claim. */
export function getIDUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("user@us_id.gov", {
    app: "staff",
    stateCode: "US_ID",
    impersonator: false,
    recidivizAllowedStates: [],
  });
}

/**
 * A US_ID commissioner, whose token carries the Parole Board access claim but
 * not the claim to edit PHI reports.
 */
export function getIDCommissioner(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("commissioner@us_id.gov", {
    app: "staff",
    stateCode: "US_ID",
    impersonator: false,
    recidivizAllowedStates: [],
    hasParoleBoardAccess: true,
  });
}

/**
 * A US_ID Pre-Hearing Investigator, whose token carries both the Parole Board
 * access claim and the claim to edit PHI reports.
 *
 * @param environment - The deploy environment an impersonator is in. Leave it
 *   unset for a PHI who is not being impersonated.
 */
export function getIDPhi(
  testEnv: RulesTestEnvironment,
  environment?: "staging" | "production",
) {
  return testEnv.authenticatedContext("phi@us_id.gov", {
    app: "staff",
    stateCode: "US_ID",
    impersonator: environment !== undefined,
    recidivizAllowedStates: [],
    hasParoleBoardAccess: true,
    canEditParoleBoardReports: true,
    ...(environment && { environment }),
  });
}

/** A demo-only US_ID Pre-Hearing Investigator. */
export function getDemoOnlyIDPhi(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("phi@us_id.gov", {
    app: "staff",
    stateCode: "US_ID",
    impersonator: false,
    recidivizAllowedStates: [],
    forceWorkflowsDemoData: true,
    hasParoleBoardAccess: true,
    canEditParoleBoardReports: true,
  });
}

/** A Recidiviz user allowed into US_ID. */
export function getIDRecidivizUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("admin", {
    app: "staff",
    stateCode: "RECIDIVIZ",
    impersonator: false,
    recidivizAllowedStates: ["US_ID"],
  });
}

/** A Recidiviz user allowed into CO but not US_ID, the other Parole Board state. */
export function getCORecidivizUser(testEnv: RulesTestEnvironment) {
  return testEnv.authenticatedContext("admin", {
    app: "staff",
    stateCode: "RECIDIVIZ",
    impersonator: false,
    recidivizAllowedStates: ["US_CO"],
  });
}
