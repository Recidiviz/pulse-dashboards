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

/* Firebase functions in Typescript documentation:
 * https://firebase.google.com/docs/functions/typescript
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {v1} from "@google-cloud/firestore";

import {pubsub} from "firebase-functions";
import {info} from "firebase-functions/logger";
import {throwErrorCustom} from "./utils";
import {defineString} from "firebase-functions/params";

const client = new v1.FirestoreAdminClient();

// Leave collectionIds empty to export all collections
// or set to a list of collection IDs to export,
// collectionIds: ['users', 'posts']
const collectionIds = [
  "milestoneMessage",
  "configs",
  "clientOpportunityUpdates",
  "clientUpdatesV2",
  "taskUpdates",
  "userUpdates",
];

// CONFIGURATION
info("CONFIGURATION INITIATED");

// Getting project ID from environment variables
const projectIdParam = defineString("PROJECT_ID");
if (!projectIdParam) {
  throwErrorCustom("❌ PROJECT_ID is not defined");
  process.exit();
}

// Getting the output bucket from environment variables
const outputBucketParam = defineString("OUTPUT_BUCKET");
if (!outputBucketParam) {
  throwErrorCustom("❌ OUTPUT_BUCKET is not defined");
  process.exit();
}


// EXPORTING FUNCTION
exports.scheduledFirestoreExport = pubsub
  .schedule("every friday 23:59") // Runs every friday at 11:59 PM PDT
  .onRun((context) => {
    const projectId = projectIdParam.value();
    const outputBucket = outputBucketParam.value();
    if (collectionIds.length === 0) {
      throwErrorCustom(
        `❌ No collections specified.
         Specify the ${projectId} collections` +
          `being exported to ${outputBucket}.`
      );
    }
    // Logging the collections to be exported
    const configurationMessage =
      "⚙️ The following collections " +
      `will be exported from ${projectId} to ${outputBucket}:
    ${`${collectionIds
    .map((collectionId) => `📁 ${collectionId}`)
    .join("\n")}\n`}`;

    info(configurationMessage);

    // Defining the export function
    const databaseName = client.databasePath(projectId, "(default)");

    return client // Initiating the export operation
      .exportDocuments({
        name: databaseName,
        outputUriPrefix: `gs://${outputBucket}`, // output destination
        collectionIds, // collections to be exported
      })
      .then((responses) => {
        const response = responses[0];
        const successInfo =
          "✅ SUCCESS: " +
          `Collections exported successfully to ${outputBucket}
          Operation Name: ${response.name}
          Event ID: ${context.eventId}`;
        info(successInfo);
      })
      .catch((err) => {
        throwErrorCustom(`❌ Export operation failed:\n${err}`);
      });
  });
