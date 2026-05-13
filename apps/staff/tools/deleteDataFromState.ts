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

/** **************************************************
 * Sample command:
 * nx delete-data-from-state staff -c staging --stateCode US_OR
 * nx delete-data-from-state staff -c production --stateCode US_OR
 *************************************************** */

import { Firestore, Query } from "@google-cloud/firestore";
import inquirer from "inquirer";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-config";

import { deleteQueryBatch } from "./firestoreUtils";

const env = process.env.NX_CONFIGURATION;
const stateCode = process.argv[2];

if (!env) {
  throw new Error(
    "NX_CONFIGURATION not set. Run with -c staging or -c production",
  );
}

function getFirebaseSettings() {
  const credentialsJson = process.env.FIREBASE_CREDENTIAL_JSON;
  if (!credentialsJson) {
    throw new Error("FIREBASE_CREDENTIAL_JSON environment variable not set");
  }

  const credentials = JSON.parse(credentialsJson);

  if (env === "staging")
    return {
      projectId: "recidiviz-dashboard-staging",
      credentials,
    };
  if (env === "production")
    return {
      projectId: "recidiviz-dashboard-production",
      credentials,
    };
  throw new Error(`Unknown environment ${env}`);
}

const db = new Firestore(getFirebaseSettings());

async function checkAndDeleteDataFromCollection(
  count: number,
  collectionName: string,
  stateCode: string,
  query: Query,
): Promise<void> {
  const { shouldContinue } = await inquirer.prompt({
    type: "confirm",
    name: "shouldContinue",
    message: `Deleting ${count} documents from collection '${collectionName}' with stateCode '${stateCode}'. Continue?`,
    default: true,
  });
  if (shouldContinue) {
    return new Promise((resolve, reject) => {
      deleteQueryBatch(db, query, resolve).catch(reject);
    });
  }
}

async function deleteDataFromCollection(
  collectionName: string,
  stateCode: string,
): Promise<void> {
  const collectionQuery = db
    .collection(collectionName)
    .where("stateCode", "in", [
      stateCode.toUpperCase(),
      stateCode.toLowerCase(),
    ]);
  // @ts-expect-error typescript seems to be getting confused by multiple versions of the library existing,
  // but we expect this to be fine
  const collectionCount = (await collectionQuery.count().get()).data().count;
  if (collectionCount > 0) {
    return checkAndDeleteDataFromCollection(
      collectionCount,
      collectionName,
      stateCode,
      collectionQuery,
    );
  }
  // eslint-disable-next-line no-console
  console.log(
    `Skipping collection ${collectionName} with 0 documents for ${stateCode}`,
  );
}

for (const collectionName of Object.keys(FIRESTORE_GENERAL_COLLECTION_MAP)) {
  // eslint-disable-next-line no-await-in-loop
  await deleteDataFromCollection(collectionName, stateCode);
}
