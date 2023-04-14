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

import { Firestore } from "@google-cloud/firestore";
import prompts from "prompts";
import { z } from "zod";

import { collectionNames } from "../src/FirestoreStore";
import { UsNdEarlyTerminationSchema } from "../src/WorkflowsStore";

type CollectionName = keyof typeof collectionNames;

const { FIREBASE_PROJECT, FIREBASE_CREDENTIAL } = process.env;

function getDb() {
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

  return new Firestore(fsSettings);
}

const SCHEMAS = {
  earlyTerminationReferrals: UsNdEarlyTerminationSchema,
} satisfies Partial<Record<CollectionName, z.AnyZodObject>>;

(async () => {
  const selection = await prompts([
    {
      type: "select",
      name: "collection",
      message: `schema you want to test against ${FIREBASE_PROJECT}`,
      choices: Object.keys(SCHEMAS).map((k) => ({
        title: k,
        value: k,
      })),
    },
    {
      type: "number",
      name: "limit",
      message: "Sample size limit? (enter 0 to test entire collection)",
      initial: 0,
    },
  ]);

  const schema = SCHEMAS[selection.collection as keyof typeof SCHEMAS];

  const db = getDb();
  const coll = db.collection(selection.collection);
  const query = selection.limit ? coll.limit(selection.limit) : coll;

  let succeeded = 0;
  let failed = 0;
  (await query.get()).docs.forEach((d) => {
    const result = schema.safeParse(d.data());
    if (!result.success) {
      failed += 1;
      console.error(d.id, result.error.issues);
    } else {
      succeeded += 1;
    }
  });
  console.log({ succeeded, failed });
})();
