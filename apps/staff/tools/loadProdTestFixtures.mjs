// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

/* eslint-disable no-console -- this is a script that prints its output */

/**
 * This script creates a test client and staff member in the production firestore database.
 * This is so we can test the Milestones texting feature in production without affecting
 * real clients and staff.
 */

import "zx/globals"; // get access to $ function

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const loadedAt = Timestamp.now();

const testClient = {
  __loadedAt: loadedAt,
  milestones: [
    { text: "6+ months violation-free", type: "NO_VIOLATION_WITHIN_6_MONTHS" },
  ],
  officerId: "RECIDIVIZ_STAFF_ID",
  personExternalId: "RECIDIVIZ",
  displayId: "dRECIDIVIZ",
  personName: {
    givenNames: "Recidiviz",
    surname: "Test Client",
  },
  pseudonymizedId: "recidiviz-test-client",
  stateCode: "US_CA",
  supervisionLevel: "MINIMUM",
  supervisionLevelStart: "2023-01-03",
  supervisionType: "PAROLE",
};

const testStaff = {
  __loadedAt: loadedAt,
  email: "recidiviz-test-email",
  givenNames: "RECIDIVIZ",
  id: "RECIDIVIZ_STAFF_ID",
  name: "Recidiviz Staff",
  stateCode: "US_CA",
  surname: "STAFF",
};

console.log("Reading GitHub access token from Secret Manager...");

// Load environment files (auth config, service accounts, GAE config)
console.log("Loading environment files from Secret Manager...");
await $`./load_config_files.sh`.pipe(process.stdout);

console.log("Initializing Firebase...");
initializeApp({
  credential: cert("recidiviz-production-firebase-service-account.json"),
});

const db = getFirestore();

console.log("Adding testClient to clients collection...");
await db.collection("clients").doc("us_ca_RECIDIVIZ").set(testClient);

console.log("Adding testStaff to staff collection...");
await db.collection("staff").doc("RECIDIVIZ_STAFF_ID").set(testStaff);
