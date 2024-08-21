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

/* eslint-disable no-console */

import { Firestore } from "@google-cloud/firestore";
import dedent from "dedent";

import { OPPORTUNITY_CONFIGS } from "../src/WorkflowsStore/Opportunity/OpportunityConfigs";

const OPPORTUNITY_KEYS = Object.keys(OPPORTUNITY_CONFIGS);

type MigrateOptions = {
  shouldUpdate: boolean;
  shouldDelete: boolean;
};

/** **************************************************
 * How To Run:
 * This script is set up to read firebase credentials from env-cmd.
 * For instance, to run against staging the command would be:
 * `yarn env-cmd -e server ts-node tools/migrate-clientUpdates.ts`
 * That command will do a dry run, reporting actions it would have taken
 * but not actually running them.
 * To actually write to clientUpdatesV2, pass the --update flag.
 * To actually delete from clientUpdates, pass the --delete flag.
 * Both flags can be passed at once.
 * --delete without --update will not delete any documents that
 * still need to be migrated.
 *************************************************** */

// When shouldUpdate is true, migrate() will write to clientUpdatesV2.
// When shouldDelete is true, migrate() will delete clientUpdates that
//   are superseded by clientUpdatesV2.
// If either is false, it will instead log the operations it would have done.
async function migrate(
  db: Firestore,
  { shouldUpdate, shouldDelete }: MigrateOptions,
) {
  const legacyDocs = (await db.collection("clientUpdates").get()).docs;
  console.log(`Fetched ${legacyDocs.length} documents.`);

  let updateCount = 0;
  let deleteCount = 0;
  let failureCount = 0;

  await Promise.all(
    legacyDocs.map(async (legacySnapshot) => {
      try {
        const legacyData = legacySnapshot.data();

        await Promise.all(
          Object.entries(legacyData).map(async ([oppKey, oppData]) => {
            if (!OPPORTUNITY_KEYS.includes(oppKey)) {
              throw new Error(`Found non-opportunity key ${oppKey}`);
            }
            const updateRef = db.doc(
              `clientUpdatesV2/us_tn_${legacySnapshot.id}/clientOpportunityUpdates/${oppKey}`,
            );
            const updateSnapshot = await updateRef.get();
            if (!updateSnapshot.exists) {
              if (shouldUpdate) {
                await updateRef.set(oppData);
                console.log(`Updated ${updateRef.path}`);
              } else if (shouldDelete) {
                throw new Error("Document isn't migrated");
              } else {
                console.log(`Would update ${updateRef.path}`);
              }
              updateCount += 1;
            }
          }),
        );
        if (shouldDelete) {
          await legacySnapshot.ref.delete();
          console.log(`Deleted ${legacySnapshot.ref.path}`);
        } else {
          console.log(`Would delete ${legacySnapshot.ref.path}`);
        }
        deleteCount += 1;
      } catch (e) {
        console.log(`Couldn't migrate ${legacySnapshot.ref.path}:`, e);
        failureCount += 1;
      }
    }),
  );
  console.log(
    dedent`Done!
    ${shouldUpdate ? "Updated" : "Would update"} ${updateCount}.
    ${shouldDelete ? "Deleted" : "Would delete"} ${deleteCount}.
    ${failureCount} failures.`,
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
    "Running against firebase emulator. Set the FIREBASE_PROJECT and FIREBASE_CREDENTIAL environment variables to run against a real firestore.",
  );
}

const opts = {
  shouldDelete: process.argv.includes("--delete"),
  shouldUpdate: process.argv.includes("--update"),
};

if (!opts.shouldUpdate) console.log("To actually run updates, pass --update");
if (!opts.shouldDelete) console.log("To actually run deletes, pass --delete");

migrate(fsdb, opts);
