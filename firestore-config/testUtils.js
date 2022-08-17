// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";

/**
 * ETL collections are read-only
 */
export const ETL_COLLECTION_NAMES = [
  "staff",
  "clients",
  "compliantReportingReferrals",
];
/**
 * Admin collections are read-only and only readable by the user (administered by Recidiviz via console)
 */
export const ADMIN_COLLECTION_NAMES = ["featureVariants"];
/**
 * Update collections are readable and writeable by all users within a state
 */
export const SHARED_UPDATE_COLLECTION_NAMES = ["clientUpdatesV2"];
/**
 * Update collections are readable and writeable only by TN or Recidiviz
 */
export const US_TN_ONLY_UPDATE_COLLECTION_NAME = "clientUpdates";
/**
 * User update collections are readable and writable only to the user
 */
export const PERSONAL_UPDATE_COLLECTION_NAME = "userUpdates";

export function startTestEnv() {
  return initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: fs.readFileSync(
        `${path.basename(__dirname)}/firestore.rules`,
        "utf8"
      ),
    },
  });
}

export function getAnonUser(testEnv) {
  return testEnv.unauthenticatedContext();
}

export function getStatelessUser(testEnv) {
  return testEnv.authenticatedContext("user@stateless.com");
}

export function getTNUser(testEnv) {
  return testEnv.authenticatedContext("user@us_tn.gov", {
    stateCode: "US_TN",
  });
}

export function getNDUser(testEnv) {
  return testEnv.authenticatedContext("user@us_nd.gov", {
    stateCode: "US_ND",
  });
}

export function getRecidivizUser(testEnv) {
  return testEnv.authenticatedContext("admin", {
    stateCode: "RECIDIVIZ",
  });
}
