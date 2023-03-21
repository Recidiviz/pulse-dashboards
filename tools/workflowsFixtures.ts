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

import { Timestamp } from "@google-cloud/firestore";
import fs from "fs";

import { collectionNames } from "../src/FirestoreStore";
import { defaultFeatureVariantsActive } from "../src/FirestoreStore/types";
import { deleteCollection, getDb } from "./firestoreUtils";
import { locationsData } from "./fixtures/locations";
import { residentsData } from "./fixtures/residents";
import { usIdSupervisionTasksData } from "./fixtures/usIdSupervisionTasks";

const OPPORTUNITIES_WITH_FIXTURES: (keyof typeof collectionNames)[] = [
  "compliantReportingReferrals",
  "earlyTerminationReferrals",
  "LSUReferrals",
  "earnedDischargeReferrals",
  "pastFTRDReferrals",
  "supervisionLevelDowngradeReferrals",
  "usIdSupervisionLevelDowngradeReferrals",
  "usMiClassificationReviewReferrals",
  "usMeSCCPReferrals",
  "usTnExpirationReferrals",
  "usMoRestrictiveHousingStatusHearingReferrals",
  "usMeEarlyTerminationReferrals",
];

export type FixtureData<T> = {
  data: T[];
  idFunc: (arg0: T) => string;
};

const FIXTURES_TO_LOAD: Partial<
  Record<keyof typeof collectionNames, FixtureData<any>>
> = {
  residents: residentsData,
  locations: locationsData,
  usIdSupervisionTasks: usIdSupervisionTasksData,
};

const db = getDb();

export async function loadClientsFixture(): Promise<void> {
  console.log("wiping existing client data ...");
  await deleteCollection(db, collectionNames.clients);

  console.log("loading new client data...");
  const bulkWriter = db.bulkWriter();

  const rawCases = JSON.parse(
    fs.readFileSync("tools/fixtures/clients.json").toString()
  );

  // Iterate through each record
  rawCases.forEach((record: Record<string, any>) => {
    bulkWriter.create(
      db.doc(
        `${collectionNames.clients}/${record.stateCode.toLowerCase()}_${
          record.personExternalId
        }`
      ),
      record
    );
  });

  bulkWriter
    .close()
    .then(() => console.log("new client data loaded successfully"));
}

export async function loadFeatureVariantsFixture(): Promise<void> {
  console.log("wiping existing featureVariants data ...");
  await deleteCollection(db, collectionNames.featureVariants);

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
    db.doc(`${collectionNames.featureVariants}/notarealemail@recidiviz.org`),
    featureVariant
  );
  bulkWriter
    .close()
    .then(() => console.log("new client featureVariants loaded successfully"));
}

export async function loadFixtures(): Promise<void> {
  for await (const [collectionName, fixtureData] of Object.entries(
    FIXTURES_TO_LOAD
  )) {
    console.log(`wiping existing ${collectionName} data ...`);
    const collectionKey = collectionName as keyof typeof collectionNames;
    await deleteCollection(db, collectionNames[collectionKey]);

    console.log(`loading new ${collectionKey} data...`);
    const bulkWriter = db.bulkWriter();

    // Iterate through each record
    fixtureData.data.forEach((record: any) => {
      const externalId = fixtureData.idFunc(record);
      bulkWriter.create(
        db.doc(
          `${
            collectionNames[collectionKey]
          }/${record.stateCode.toLowerCase()}_${externalId}`
        ),
        record
      );
    });

    bulkWriter
      .close()
      .then(() => console.log(`new ${collectionKey} data loaded successfully`));
  }
}

export async function loadUserFixture(): Promise<void> {
  console.log("wiping existing staff data ...");
  await deleteCollection(db, collectionNames.staff);

  console.log("loading new staff data...");
  const bulkWriter = db.bulkWriter();

  const rawUsers = JSON.parse(
    fs.readFileSync("tools/fixtures/users.json").toString()
  );

  rawUsers.forEach((rawUser: any) => {
    bulkWriter.create(db.collection(collectionNames.staff).doc(), rawUser);
  });

  await bulkWriter.flush();
  await bulkWriter.close();

  console.log("new staff data loaded successfully");
}

export async function loadOpportunityReferralFixtures(): Promise<void> {
  for await (const opportunity of OPPORTUNITIES_WITH_FIXTURES) {
    console.log(
      `wiping existing ${collectionNames[opportunity]} referral data ...`
    );
    await deleteCollection(db, collectionNames[opportunity]);

    console.log(`loading new ${collectionNames[opportunity]} referral data...`);
    const bulkWriter = db.bulkWriter();

    const rawRecords = JSON.parse(
      fs.readFileSync(`tools/fixtures/${opportunity}.json`).toString()
    );

    rawRecords.forEach((rawReferral: any) => {
      // TN data still in a legacy format, so fall back to alternate field
      const externalId = rawReferral.externalId ?? rawReferral.tdocId;
      bulkWriter.create(
        db.doc(
          `${
            collectionNames[opportunity]
          }/${rawReferral.stateCode.toLowerCase()}_${externalId}`
        ),
        rawReferral
      );
    });

    await bulkWriter.flush();
    await bulkWriter.close();

    console.log(
      `new ${collectionNames[opportunity]} referral data loaded successfully`
    );
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
