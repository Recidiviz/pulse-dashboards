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
 * Admin collections are read-only (administered by Recidiviz via console)
 */
export const ADMIN_COLLECTION_NAMES = ["featureVariants"];
/**
 * Update collections are writeable
 */
export const UPDATE_COLLECTION_NAMES = ["userUpdates", "clientUpdates"];

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
  return testEnv.authenticatedContext("foo");
}

export function getTNUser(testEnv) {
  return testEnv.authenticatedContext("foo", {
    stateCode: "US_TN",
  });
}

export function getOutOfStateUser(testEnv) {
  return testEnv.authenticatedContext("foo", {
    stateCode: "US_ID",
  });
}

export function getRecidivizUser(testEnv) {
  return testEnv.authenticatedContext("admin", {
    stateCode: "RECIDIVIZ",
  });
}
