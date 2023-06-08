/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
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

import { Firestore, Timestamp } from "@google-cloud/firestore";
import fs from "fs";

import { collectionNames } from "../src/FirestoreStore";
import {
  CollectionName,
  defaultFeatureVariantsActive,
} from "../src/FirestoreStore/types";
import { deleteCollection } from "./firestoreUtils";
import { locationsData } from "./fixtures/locations";
import { residentsData } from "./fixtures/residents";
import { usTnSupervisionLevelDowngradeReferrals } from "./fixtures/supervisionLevelDowngradeReferrals";
import { usIdPastFtrdFixture } from "./fixtures/UsIdPastFtrdReferrals";
import { usIdSupervisionLevelDowngradeReferrals } from "./fixtures/usIdSupervisionLevelDowngradeReferrals";
import { usIdSupervisionTasksData } from "./fixtures/usIdSupervisionTasks";
import { usMeEarlyTerminationReferralsFixture } from "./fixtures/usMeEarlyTerminationReferrals";
import { usMeSCCPFixture } from "./fixtures/usMeSCCPReferrals";
import { usMiMinimumTelephoneReportingReferralsFixture } from "./fixtures/usMiMinimumTelephoneReportingReferrals";
import { usMiPastFTRDReferralsFixture } from "./fixtures/usMiPastFTRDReferrals";
import { usMiSupervisionLevelDowngradeReferrals } from "./fixtures/usMiSupervisionLevelDowngradeReferrals";
import { usMoRestrictiveHousingStatusHearingFixture } from "./fixtures/usMoRestrictiveHousingStatusHearingReferrals";
import { usNdEarlyTerminationFixture } from "./fixtures/usNdEarlyTerminationReferrals";
import { usTnCustodyLevelDowngradeFixture } from "./fixtures/usTnCustodyLevelDowngradeReferrals";

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

console.log(fsSettings);

const db = new Firestore(fsSettings);

const OPPORTUNITIES_WITH_JSON_FIXTURES: CollectionName[] = [
  "compliantReportingReferrals",
  "LSUReferrals",
  "earnedDischargeReferrals",
  "usMiClassificationReviewReferrals",
  "usMiEarlyDischargeReferrals",
  "usTnExpirationReferrals",
];

export type FixtureData<T> = {
  data: T[];
  idFunc: (arg0: T) => string;
};

const FIXTURES_TO_LOAD: Partial<Record<CollectionName, FixtureData<any>>> = {
  residents: residentsData,
  locations: locationsData,
  usIdSupervisionTasks: usIdSupervisionTasksData,
  earlyTerminationReferrals: usNdEarlyTerminationFixture,
  pastFTRDReferrals: usIdPastFtrdFixture,
  supervisionLevelDowngradeReferrals: usTnSupervisionLevelDowngradeReferrals,
  usIdSupervisionLevelDowngradeReferrals,
  usMeSCCPReferrals: usMeSCCPFixture,
  usMiMinimumTelephoneReportingReferrals:
    usMiMinimumTelephoneReportingReferralsFixture,
  usMiSupervisionLevelDowngradeReferrals,
  usMiPastFTRDReferrals: usMiPastFTRDReferralsFixture,
  usMoRestrictiveHousingStatusHearingReferrals:
    usMoRestrictiveHousingStatusHearingFixture,
  usMeEarlyTerminationReferrals: usMeEarlyTerminationReferralsFixture,
  usTnCustodyLevelDowngradeReferrals: usTnCustodyLevelDowngradeFixture,
} as const;

// If we're writing to the real firestore, don't clobber the real data
const collectionPrefix = FIREBASE_CREDENTIAL ? "DEMO" : null;

function collectionName(c: keyof typeof collectionNames) {
  return collectionPrefix
    ? `${collectionPrefix}_${collectionNames[c]}`
    : collectionNames[c];
}

export async function loadClientsFixture(): Promise<void> {
  console.log("wiping existing client data ...");
  await deleteCollection(db, collectionName("clients"));

  console.log("loading new client data...");
  const bulkWriter = db.bulkWriter();

  const rawCases = JSON.parse(
    fs.readFileSync("tools/fixtures/clients.json").toString()
  );

  // Iterate through each record
  rawCases.forEach((record: Record<string, any>) => {
    bulkWriter.create(
      db
        .collection(collectionName("clients"))
        .doc(`${record.stateCode.toLowerCase()}_${record.personExternalId}`),
      record
    );
  });

  bulkWriter
    .close()
    .then(() => console.log("new client data loaded successfully"));
}

export async function loadFeatureVariantsFixture(): Promise<void> {
  console.log("wiping existing featureVariants data ...");
  await deleteCollection(db, collectionName("featureVariants"));

  console.log("loading new featureVariants data...");
  const bulkWriter = db.bulkWriter();

  const featureVariant = {
    ...defaultFeatureVariantsActive,
    usTnExpiration: {
      activeDate: new Timestamp(0, 0),
    },
  };

  // Iterate through each record
  bulkWriter.create(
    db
      .collection(collectionName("featureVariants"))
      .doc("notarealemail@recidiviz.org"),
    featureVariant
  );
  bulkWriter
    .close()
    .then(() => console.log("new client featureVariants loaded successfully"));
}

export async function loadFixtures(): Promise<void> {
  for await (const [collStr, fixtureData] of Object.entries(FIXTURES_TO_LOAD)) {
    const coll = collStr as CollectionName;
    console.log(`wiping existing ${coll} data ...`);
    await deleteCollection(db, collectionName(coll));

    console.log(`loading new ${coll} data...`);
    const bulkWriter = db.bulkWriter();

    // Iterate through each record
    fixtureData.data.forEach((record: any) => {
      const externalId = fixtureData.idFunc(record);
      bulkWriter.create(
        db
          .collection(collectionName(coll))
          .doc(`${record.stateCode.toLowerCase()}_${externalId}`),
        record
      );
    });

    bulkWriter
      .close()
      .then(() => console.log(`new ${coll} data loaded successfully`));
  }
}

export async function loadUserFixture(): Promise<void> {
  console.log("wiping existing staff data ...");
  await deleteCollection(db, collectionName("staff"));

  console.log("loading new staff data...");
  const bulkWriter = db.bulkWriter();

  const rawUsers = JSON.parse(
    fs.readFileSync("tools/fixtures/users.json").toString()
  );

  rawUsers.forEach((rawUser: any) => {
    bulkWriter.create(
      db
        .collection(collectionName("staff"))
        .doc(`${rawUser.stateCode.toLowerCase()}_${rawUser.id}`),
      rawUser
    );
  });

  await bulkWriter.flush();
  await bulkWriter.close();

  console.log("new staff data loaded successfully");
}

export async function loadOpportunityReferralFixtures(): Promise<void> {
  for await (const opportunity of OPPORTUNITIES_WITH_JSON_FIXTURES) {
    console.log(`wiping existing ${opportunity} referral data ...`);
    await deleteCollection(db, collectionName(opportunity));

    console.log(`loading new ${opportunity} referral data...`);
    const bulkWriter = db.bulkWriter();

    const rawRecords = JSON.parse(
      fs.readFileSync(`tools/fixtures/${opportunity}.json`).toString()
    );

    rawRecords.forEach((rawReferral: any) => {
      // TN data still in a legacy format, so fall back to alternate field
      const externalId = rawReferral.externalId ?? rawReferral.tdocId;
      bulkWriter.create(
        db
          .collection(collectionName(opportunity))
          .doc(`${rawReferral.stateCode.toLowerCase()}_${externalId}`),
        rawReferral
      );
    });

    await bulkWriter.flush();
    await bulkWriter.close();

    console.log(`new ${opportunity} referral data loaded successfully`);
  }
}

export async function loadWorkflowsFixtures(): Promise<void> {
  await Promise.all([
    loadUserFixture(),
    loadClientsFixture(),
    loadFixtures(),
    loadOpportunityReferralFixtures(),
    loadFeatureVariantsFixture(),
  ]);
}
