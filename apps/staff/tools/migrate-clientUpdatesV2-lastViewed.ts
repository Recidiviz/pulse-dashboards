/* eslint-disable no-console */
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

import { FieldValue, Firestore } from "@google-cloud/firestore";
import dedent from "dedent";

/** **************************************************
 * How To Run:
 * This script is set up to read firebase credentials from env-cmd.
 * For instance, to run against staging the command would be:
 * `yarn env-cmd -e server ts-node tools/migrate-clientUpdates.ts`
 * That command will do a dry run, reporting actions it would have taken
 * but not actually running them.
 *
 * To actually write to clientUpdatesV2, pass the --update flag.
 *
 * This migration will delete `firstViewed` property if `lastViewed` already exists
 * and it will add the `lastViewed` property with the `firstViewed` value if only
 * `firstViewed` exists.
 *************************************************** */

async function migrate(
  db: Firestore,
  { shouldUpdate }: { shouldUpdate: boolean }
) {
  const clientOpportunityUpdates = (
    await db.collectionGroup("clientOpportunityUpdates").get()
  ).docs;
  console.log(`Fetched ${clientOpportunityUpdates.length} documents.`);

  let updatedCount = 0;
  let failureCount = 0;

  const newField = "lastViewed";
  const oldField = "firstViewed";

  await Promise.all(
    clientOpportunityUpdates.map(async (snapshot) => {
      try {
        const documentData = snapshot.data();
        const firstViewedValue = documentData[oldField];
        const lastViewedValue = documentData[newField];

        if (!firstViewedValue && !lastViewedValue) return;

        /* Replace firstViewed with lastViewed */
        if (firstViewedValue !== undefined && !lastViewedValue) {
          if (shouldUpdate) {
            console.log(
              `Setting firstViewed value of ${JSON.stringify(
                firstViewedValue
              )} to lastViewed field. Previous lastViewed value: ${JSON.stringify(
                lastViewedValue
              )}`
            );
            await snapshot.ref.update(
              {
                [newField]: firstViewedValue,
                [oldField]: FieldValue.delete(),
              },
              // This precondition tells the server to fail the update
              // if the document has been updated since we fetched it.
              { lastUpdateTime: snapshot.updateTime }
            );
          } else {
            console.log(
              `Would be adding lastViewed property to ${snapshot.ref.path}`
            );
          }
          updatedCount += 1;
        }

        /* Delete old firstViewed field */
        if (firstViewedValue !== undefined && lastViewedValue !== undefined) {
          if (shouldUpdate) {
            console.log(
              `Deleting old firstViewed value of ${JSON.stringify(
                firstViewedValue
              )} to lastViewed field. lastViewed value is: ${JSON.stringify(
                lastViewedValue
              )}`
            );
            await snapshot.ref.update(
              snapshot.ref,
              {
                [oldField]: FieldValue.delete(),
              },
              // This precondition tells the server to fail the update
              // if the document has been updated since we fetched it.
              { lastUpdateTime: snapshot.updateTime }
            );
          } else {
            console.log(
              `Would be deleting firstViewed property for path ${snapshot.ref.path}`
            );
          }
          updatedCount += 1;
        }
      } catch (e) {
        console.log(`Couldn't migrate ${snapshot.ref.path}:`, e);
        failureCount += 1;
      }
    })
  );
  console.log(
    dedent`Done!
    ${updatedCount} updates.
    ${failureCount} failures.`
  );
}

const { FIREBASE_PROJECT, FIREBASE_CREDENTIAL } = process.env;

const fsSettings: FirebaseFirestore.Settings = FIREBASE_CREDENTIAL
  ? {
      projectId: FIREBASE_PROJECT,
      keyFilename: FIREBASE_CREDENTIAL,
    }
  : {
      projectId: "demo-dev",
      host: "localhost:8080",
      credentials: {},
      ssl: false,
      keyFilename: "",
      ignoreUndefinedProperties: true,
    };

const fsdb = new Firestore(fsSettings);

if (!FIREBASE_CREDENTIAL) {
  console.log(
    "Running against firebase emulator. Set the FIREBASE_PROJECT and FIREBASE_CREDENTIAL environment variables to run against a real firestore."
  );
}

const opts = {
  shouldUpdate: process.argv.includes("--update"),
};

if (!opts.shouldUpdate) console.log("To actually run updates, pass --update");

migrate(fsdb, opts);
