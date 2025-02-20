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

import { FieldValue, Firestore } from "@google-cloud/firestore";

import { OpportunityType } from "~datatypes";

import { PartialRecord } from "../src/utils/typeUtils";

type Options = {
  /** Update dry run if not set */
  shouldUpdate: boolean;
  /** Deletion dry run if not set */
  shouldDelete: boolean;
};

const formIdByOpp: PartialRecord<OpportunityType, string> = {
  usPaAdminSupervision: "UsPaAdminSupervisionForm-usPaAdminSupervision",
  usMiAddInPersonSecurityClassificationCommitteeReview:
    "UsMiSCCReviewForm-common",
  usMiSecurityClassificationCommitteeReview: "UsMiSCCReviewForm-common",
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    "UsMiSCCReviewForm-common",
  usTnExpiration: "UsTnExpirationForm-usTnExpiration",
  usTnCustodyLevelDowngrade:
    "UsTnReclassificationReviewForm-usTnCustodyLevelDowngrade",
  usTnAnnualReclassification:
    "UsTnReclassificationReviewForm-usTnAnnualReclassification",
  usMeWorkRelease: "UsMeWorkReleaseForm-usMeWorkRelease",
  usMeSCCP: "UsMeSCCPForm-usMeSCCP",
  usMeFurloughRelease: "UsMeFurloughReleaseForm-usMeFurloughRelease",
  usMeReclassificationReview:
    "UsMeAnnualReclassificationReviewForm-usMeReclassificationReview",
  earnedDischarge: "UsIdEarnedDischargeForm-earnedDischarge",
  usCaSupervisionLevelDowngrade:
    "UsCaSupervisionLevelDowngradeForm-usCaSupervisionLevelDowngrade",
  LSU: "LSUForm-LSU",
  earlyTermination: "EarlyTerminationForm-earlyTermination",
  compliantReporting: "CompliantReportingForm-compliantReporting",
};

const { FIREBASE_PROJECT, FIREBASE_CREDENTIAL } = process.env;
console.log({ FIREBASE_PROJECT, FIREBASE_CREDENTIAL });

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

const db = getDb();

const skippedOpps: PartialRecord<OpportunityType, number> = {};

async function migrateFormUpdates({ shouldUpdate, shouldDelete }: Options) {
  const legacyFormUpdateDocs = (
    await db
      .collectionGroup("clientOpportunityUpdates")
      .where("referralForm", "!=", null)
      .get()
  ).docs;

  await Promise.all(
    legacyFormUpdateDocs.map(async (legacySnapshot) => {
      try {
        const legacyDoc = legacySnapshot.data();
        const { path } = legacySnapshot.ref;

        // Legacy path:
        // "clientUpdatesV2/client_id/clientOpportunityUpdates/usXxOpportunityType"
        const client_id = path.split("/").slice(-3)[0];
        const opportunityType = path.split("/").slice(-1)[0] as OpportunityType;
        const newFormId = formIdByOpp[opportunityType];

        if (newFormId === undefined) {
          console.log("No formId configured for doc: ", path);
          if (skippedOpps[opportunityType] !== undefined) {
            skippedOpps[opportunityType]++;
          } else {
            skippedOpps[opportunityType] = 1;
          }
          return;
        }
        const formUpdateData = legacyDoc.referralForm;

        // New path:
        // "clientUpdatesV2/client_id/clientFormUpdates/formId"
        const newFormUpdatesRef = db.doc(
          `clientUpdatesV2/${client_id}/clientFormUpdates/${newFormId}`,
        );
        const newSnapshot = await newFormUpdatesRef.get();
        if (!newSnapshot.exists) {
          if (shouldUpdate) {
            await newFormUpdatesRef.set(formUpdateData);
            console.log(`Updated ${newFormUpdatesRef.path}`);
          } else {
            console.log(`Would update ${newFormUpdatesRef.path}`);
          }
        }
        if (shouldDelete) {
          await legacySnapshot.ref.update({
            referralForm: FieldValue.delete(),
          });
          console.log(`Delete referralForm from ${path}`);
        } else {
          console.log(`Would delete referralForm from ${path}`);
        }
      } catch (e) {
        console.log("Error migrating: ", legacySnapshot.ref.path);
        console.log(e);
      }
    }),
  );
  console.log("Skipped updates for missing formId:\n", skippedOpps);
}

const opts = {
  shouldUpdate: process.argv.includes("--update"),
  shouldDelete: process.argv.includes("--delete"),
};

if (!opts.shouldUpdate) console.log("To actually run updates, pass --update");
if (!opts.shouldDelete) console.log("To actually run deletion, pass --delete");

migrateFormUpdates(opts);
