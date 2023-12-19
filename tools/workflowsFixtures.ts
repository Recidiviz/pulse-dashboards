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

import { Firestore } from "@google-cloud/firestore";
import fs from "fs";

import { FIRESTORE_COLLECTIONS_MAP } from "../src/FirestoreStore/constants";
import {
  FirestoreCollectionKey,
  MilestonesMessage,
} from "../src/FirestoreStore/types";
import { getMonthYearFromDate } from "../src/WorkflowsStore/utils";
import { deleteCollection } from "./firestoreUtils";
import { clientsData } from "./fixtures/clients";
import { clientUpdatesV2Data } from "./fixtures/clientUpdatesV2";
import { locationsData } from "./fixtures/locations";
import { residentsData } from "./fixtures/residents";
import { staffData } from "./fixtures/staff";
import { usTnSupervisionLevelDowngradeReferrals } from "./fixtures/supervisionLevelDowngradeReferrals";
import { usCaSupervisionLevelDowngradeReferrals } from "./fixtures/usCaSupervisionLevelDowngradeReferrals";
import { usIdCRCResidentWorkerReferrals } from "./fixtures/UsIdCRCResidentWorkerReferrals";
import { usIdCRCWorkReleaseReferrals } from "./fixtures/UsIdCRCWorkReleaseReferrals";
import { usIdExpandedCRCReferrals } from "./fixtures/UsIdExpandedCRCReferrals";
import { usIdPastFtrdFixture } from "./fixtures/UsIdPastFtrdReferrals";
import { usIdSupervisionLevelDowngradeReferrals } from "./fixtures/usIdSupervisionLevelDowngradeReferrals";
import { usIdSupervisionTasksData } from "./fixtures/usIdSupervisionTasks";
import { usMeEarlyTerminationReferralsFixture } from "./fixtures/usMeEarlyTerminationReferrals";
import { usMeFurloughReleaseFixture } from "./fixtures/UsMeFurloughReleaseReferrals";
import { usMeSCCPFixture } from "./fixtures/usMeSCCPReferrals";
import { usMeWorkReleaseReferrals } from "./fixtures/usMeWorkReleaseReferrals";
import { UsMiClassificationReviewReferralsFixture } from "./fixtures/usMiClassificationReviewReferrals";
import { usMiEarlyDischargeReferralsFixture } from "./fixtures/usMiEarlyDischargeReferrals";
import { usMiMinimumTelephoneReportingReferralsFixture } from "./fixtures/usMiMinimumTelephoneReportingReferrals";
import { usMiPastFTRDReferralsFixture } from "./fixtures/usMiPastFTRDReferrals";
import { usMiSupervisionLevelDowngradeReferrals } from "./fixtures/usMiSupervisionLevelDowngradeReferrals";
import { usMoOverdueRestrictiveHousingInitialHearingReferrals } from "./fixtures/usMoOverdueRestrictiveHousingInitialHearingReferrals";
import { usMoOverdueRestrictiveHousingReleaseReferrals } from "./fixtures/usMoOverdueRestrictiveHousingReleaseReferrals";
import { usMoRestrictiveHousingStatusHearingFixture } from "./fixtures/usMoRestrictiveHousingStatusHearingReferrals";
import { usNdEarlyTerminationFixture } from "./fixtures/usNdEarlyTerminationReferrals";
import { usOrEarnedDischargeReferrals } from "./fixtures/usOrEarnedDischargeReferrals";
import { usTnAnnualReclassificationReviewFixture } from "./fixtures/usTnAnnualReclassificationReviewReferrals";
import { usTnCompliantReportingReferrals } from "./fixtures/usTnCompliantReportingReferrals";
import { usTnCustodyLevelDowngradeFixture } from "./fixtures/usTnCustodyLevelDowngradeReferrals";
import { usTnExpirationFixture } from "./fixtures/usTnExpirationReferrals";

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

const OPPORTUNITIES_WITH_JSON_FIXTURES: FirestoreCollectionKey[] = [
  "LSUReferrals",
  "earnedDischargeReferrals",
];

export type FixtureData<T> = {
  data: T[];
  idFunc: (arg0: T) => string;
};

type Logger = {
  (...data: any[]): void;
};

// TODO: Move to OpportunityConfig
const FIXTURES_TO_LOAD: Partial<
  Record<FirestoreCollectionKey, FixtureData<any>>
> = {
  clients: clientsData,
  residents: residentsData,
  staff: staffData,
  locations: locationsData,
  usIdSupervisionTasks: usIdSupervisionTasksData,
  earlyTerminationReferrals: usNdEarlyTerminationFixture,
  pastFTRDReferrals: usIdPastFtrdFixture,
  supervisionLevelDowngradeReferrals: usTnSupervisionLevelDowngradeReferrals,
  usCaSupervisionLevelDowngradeReferrals,
  usIdCRCResidentWorkerReferrals,
  usIdCRCWorkReleaseReferrals,
  usIdExpandedCRCReferrals,
  usMoOverdueRestrictiveHousingReleaseReferrals,
  usIdSupervisionLevelDowngradeReferrals,
  usMeSCCPReferrals: usMeSCCPFixture,
  usMeWorkReleaseReferrals,
  usMiEarlyDischargeReferrals: usMiEarlyDischargeReferralsFixture,
  usMiClassificationReviewReferrals: UsMiClassificationReviewReferralsFixture,
  usMiMinimumTelephoneReportingReferrals:
    usMiMinimumTelephoneReportingReferralsFixture,
  usMiSupervisionLevelDowngradeReferrals,
  usMiPastFTRDReferrals: usMiPastFTRDReferralsFixture,
  usMoRestrictiveHousingStatusHearingReferrals:
    usMoRestrictiveHousingStatusHearingFixture,
  usMeEarlyTerminationReferrals: usMeEarlyTerminationReferralsFixture,
  usMeFurloughReleaseReferrals: usMeFurloughReleaseFixture,
  usOrEarnedDischargeReferrals,
  compliantReportingReferrals: usTnCompliantReportingReferrals,
  usTnCustodyLevelDowngradeReferrals: usTnCustodyLevelDowngradeFixture,
  usTnExpirationReferrals: usTnExpirationFixture,
  usTnAnnualReclassificationReferrals: usTnAnnualReclassificationReviewFixture,
  usMoOverdueRestrictiveHousingInitialHearingReferrals,
} as const;

// If we're writing to the real firestore, don't clobber the real data
const collectionPrefix = FIREBASE_CREDENTIAL ? "DEMO" : null;

function generateCollectionName(c: FirestoreCollectionKey) {
  return collectionPrefix
    ? `${collectionPrefix}_${FIRESTORE_COLLECTIONS_MAP[c]}`
    : FIRESTORE_COLLECTIONS_MAP[c];
}

export async function loadFixtures(logger: Logger): Promise<void> {
  for await (const [collStr, fixtureData] of Object.entries(FIXTURES_TO_LOAD)) {
    const coll = collStr as FirestoreCollectionKey;
    logger(`wiping existing ${coll} data ...`);
    await deleteCollection(db, generateCollectionName(coll));

    logger(`loading new ${coll} data...`);
    const bulkWriter = db.bulkWriter();
    if (!fixtureData) throw new Error(`No fixture data for ${coll}`);
    // Iterate through each record
    fixtureData.data.forEach((record: any) => {
      const externalId = fixtureData.idFunc(record);
      bulkWriter.create(
        db
          .collection(generateCollectionName(coll))
          .doc(`${record.stateCode.toLowerCase()}_${externalId}`),
        record
      );
    });

    bulkWriter
      .close()
      .then(() => logger(`new ${coll} data loaded successfully`));
  }
}

export async function loadOpportunityReferralFixtures(
  logger: Logger
): Promise<void> {
  for await (const opportunity of OPPORTUNITIES_WITH_JSON_FIXTURES) {
    logger(`wiping existing ${opportunity} referral data ...`);
    await deleteCollection(db, generateCollectionName(opportunity));

    logger(`loading new ${opportunity} referral data...`);
    const bulkWriter = db.bulkWriter();

    const rawRecords = JSON.parse(
      fs.readFileSync(`tools/fixtures/${opportunity}.json`).toString()
    );

    rawRecords.forEach((rawReferral: any) => {
      // TN data still in a legacy format, so fall back to alternate field
      const externalId = rawReferral.externalId ?? rawReferral.tdocId;
      bulkWriter.create(
        db
          .collection(generateCollectionName(opportunity))
          .doc(`${rawReferral.stateCode.toLowerCase()}_${externalId}`),
        rawReferral
      );
    });

    await bulkWriter.flush();
    await bulkWriter.close();

    logger(`new ${opportunity} referral data loaded successfully`);
  }
}

async function loadClientUpdatesV2(logger: Logger): Promise<void> {
  logger(`wiping existing clientUpdatesV2 data ...`);
  await deleteCollection(db, generateCollectionName("clientUpdatesV2"));

  const { milestonesMessages } = clientUpdatesV2Data;

  logger(`loading new milestonesMessages update data...`);
  const bulkWriter = db.bulkWriter();

  milestonesMessages.forEach(
    (record: MilestonesMessage & { externalId: string }) => {
      const { externalId } = record;
      bulkWriter.create(
        db
          .collection(generateCollectionName("clientUpdatesV2"))
          .doc(externalId)
          .collection(generateCollectionName("milestonesMessages"))
          .doc(getMonthYearFromDate(new Date())),
        record
      );
    }
  );
  bulkWriter.close().then(() => logger(`new  data loaded successfully`));
}

export async function loadWorkflowsFixtures({
  quietLogs = false,
} = {}): Promise<void> {
  let logger = console.log;
  if (quietLogs) {
    logger = function () {
      return null;
    };
  }
  await Promise.all([
    loadFixtures(logger),
    loadOpportunityReferralFixtures(logger),
    loadClientUpdatesV2(logger),
  ]);
}
