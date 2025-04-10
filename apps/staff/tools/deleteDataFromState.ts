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
 * nx delete-data-from-state staff --dbEnv staging --stateCode US_OR
 *************************************************** */

import { Firestore, Query } from "@google-cloud/firestore";
import inquirer from "inquirer";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-api";

import { deleteQueryBatch } from "./firestoreUtils";

const env = process.argv[2];
const stateCode = process.argv[3];

function getFirebaseSettings() {
  if (env === "staging")
    return {
      projectId: "recidiviz-dashboard-staging",
      keyFilename: "./recidiviz-dev-firebase-service-account.json",
    };
  if (env === "production")
    return {
      projectId: "recidiviz-dashboard-production",
      keyFilename: "./recidiviz-production-firebase-service-account.json",
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
