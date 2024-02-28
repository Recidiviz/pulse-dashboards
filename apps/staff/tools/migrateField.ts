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

type MigrateFieldOptions = {
  collection: string;
  oldField: string;
  newField: string;
};

async function migrateField(
  db: Firestore,
  { collection, oldField, newField }: MigrateFieldOptions,
) {
  const bulkWriter = db.bulkWriter();

  let updatedCount = 0;
  let failureCount = 0;

  const snapshot = await db.collection(collection).get();
  console.log(`Fetched ${snapshot.size} documents.`);

  const promises = snapshot.docs.map(async (doc) => {
    const value = doc.data()[oldField];
    if (value) {
      try {
        await bulkWriter.update(
          doc.ref,
          {
            [newField]: value,
            [oldField]: FieldValue.delete(),
          },
          // This precondition tells the server to fail the update
          // if the document has been updated since we fetched it.
          { lastUpdateTime: doc.updateTime },
        );
        updatedCount += 1;
      } catch (e) {
        failureCount += 1;
        console.log(`${doc.id} failed: ${e}`);
      }
    }
  });

  promises.push(bulkWriter.close());
  await Promise.all(promises);

  console.log(`Successfully updated ${updatedCount} documents.`);
  if (failureCount > 0) {
    console.log(`${failureCount} attempted updates failed.`);
  }
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

migrateField(fsdb, {
  collection: "userUpdates",
  oldField: "selectedOfficerIds",
  newField: "selectedSearchIds",
});
