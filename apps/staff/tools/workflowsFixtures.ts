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
import { mapValues } from "lodash";

import {
  FixtureMapping,
  incarcerationStaffFixtures,
  ParsedRecord,
  rawUsMaResidents,
  supervisionStaffFixtures,
  usMeAnnualReclassificationFixtures,
  usMeMediumTrusteeFixtures,
  usMeSccpFixtures,
  usMiAddInPersonSecurityClassificationCommitteeReviewFixtures,
  usMiReclassificationRequestFixtures,
  usMiSecurityClassificationCommitteeReviewFixtures,
  usMiWardenInPersonSecurityClassificationCommitteeReviewFixtures,
  usPaSpecialCircumstancesSupervisionFixtures,
} from "~datatypes";
import {
  FIRESTORE_GENERAL_COLLECTION_MAP,
  FirestoreCollectionKey,
} from "~firestore-api";

import { mockOpportunityConfigs } from "../src/core/__tests__/testUtils";
import { MilestonesMessage } from "../src/FirestoreStore/types";
import { PartialRecord } from "../src/utils/typeUtils";
import { getMonthYearFromDate } from "../src/WorkflowsStore/utils";
import { deleteCollection } from "./firestoreUtils";
import { clientsData } from "./fixtures/clients";
import { clientUpdatesV2Data } from "./fixtures/clientUpdatesV2";
import { earnedDischargeReferralsFixture } from "./fixtures/earnedDischargeReferrals";
import { locationsData } from "./fixtures/locations";
import { LSUReferralsFixture } from "./fixtures/LSUReferrals";
import { FixtureOpportunityType } from "./fixtures/opportunities";
import { residentsData } from "./fixtures/residents";
import { usTnSupervisionLevelDowngradeReferrals } from "./fixtures/supervisionLevelDowngradeReferrals";
import { usArInstitutionalWorkerStatusReferrals } from "./fixtures/usArInstitutionalWorkerStatusReferrals";
import { usAzOverdueForACISDTPReferrals } from "./fixtures/usAzOverdueForACISDTPReferrals";
import { usAzOverdueForACISTPRReferrals } from "./fixtures/usAzOverdueForACISTPRReferrals";
import { usAzReleaseToDTPReferrals } from "./fixtures/usAzReleaseToDTPReferrals";
import { usAzReleaseToTPRReferrals } from "./fixtures/usAzReleaseToTPRReferrals";
import { usCaSupervisionLevelDowngradeReferrals } from "./fixtures/usCaSupervisionLevelDowngradeReferrals";
import { usIaEarlyDischargeReferralsFixture } from "./fixtures/usIaEarlyDischargeReferrals";
import { usIdCRCResidentWorkerReferrals } from "./fixtures/UsIdCRCResidentWorkerReferrals";
import { usIdCRCWorkReleaseReferrals } from "./fixtures/UsIdCRCWorkReleaseReferrals";
import { usIdCustodyLevelDowngradeReferrals } from "./fixtures/usIdCustodyLevelDowngradeReferrals";
import { usIdExpandedCRCReferrals } from "./fixtures/UsIdExpandedCRCReferrals";
import { usIdPastFtrdFixture } from "./fixtures/UsIdPastFtrdReferrals";
import { usIdSupervisionLevelDowngradeReferrals } from "./fixtures/usIdSupervisionLevelDowngradeReferrals";
import { usIdSupervisionTasksData } from "./fixtures/usIdSupervisionTasks";
import { usMeEarlyTerminationReferralsFixture } from "./fixtures/usMeEarlyTerminationReferrals";
import { usMeFurloughReleaseFixture } from "./fixtures/UsMeFurloughReleaseReferrals";
import { usMeWorkReleaseReferrals } from "./fixtures/usMeWorkReleaseReferrals";
import { UsMiClassificationReviewReferralsFixture } from "./fixtures/usMiClassificationReviewReferrals";
import { usMiEarlyDischargeReferralsFixture } from "./fixtures/usMiEarlyDischargeReferrals";
import { usMiMinimumTelephoneReportingReferralsFixture } from "./fixtures/usMiMinimumTelephoneReportingReferrals";
import { usMiPastFTRDReferralsFixture } from "./fixtures/usMiPastFTRDReferrals";
import { usMiSupervisionLevelDowngradeReferrals } from "./fixtures/usMiSupervisionLevelDowngradeReferrals";
import { usMoOverdueRestrictiveHousingInitialHearingReferrals } from "./fixtures/usMoOverdueRestrictiveHousingInitialHearingReferrals";
import { usMoOverdueRestrictiveHousingReleaseReferrals } from "./fixtures/usMoOverdueRestrictiveHousingReleaseReferrals";
import { usMoOverdueRestrictiveHousingReviewHearingReferrals } from "./fixtures/usMoOverdueRestrictiveHousingReviewHearingReferrals";
import { usNdEarlyTerminationFixture } from "./fixtures/usNdEarlyTerminationReferrals";
import { usPaAdminSupervisionReferrals } from "./fixtures/usPaAdminSupervisionReferrals";
import { usTnAnnualReclassificationReviewFixture } from "./fixtures/usTnAnnualReclassificationReviewReferrals";
import { usTnCompliantReporting2025PolicyReferrals } from "./fixtures/usTnCompliantReporting2025PolicyReferrals";
import { usTnCompliantReportingReferrals } from "./fixtures/usTnCompliantReportingReferrals";
import { usTnCustodyLevelDowngradeFixture } from "./fixtures/usTnCustodyLevelDowngradeReferrals";
import { usTnExpirationFixture } from "./fixtures/usTnExpirationReferrals";
import { usTnInitialClassificationFixture } from "./fixtures/usTnInitialClassificationReferrals";
import { usTnSuspensionOfDirectSupervisionFixture } from "./fixtures/UsTnSuspensionOfDirectSupervisionReferrals";
import { usTxSupervisionTasksData } from "./fixtures/usTxSupervisionTasks";
import { usUtEarlyTerminationReferrals } from "./fixtures/usUtEarlyTerminationReferrals";
import { FirestoreFixture, fixtureFromParsedRecords } from "./fixtures/utils";

const { FIREBASE_PROJECT, FIREBASE_CREDENTIAL } = process.env;

const fsSettings: FirebaseFirestore.Settings = FIREBASE_CREDENTIAL
  ? {
      projectId: FIREBASE_PROJECT,
      keyFilename: FIREBASE_CREDENTIAL,
      ignoreUndefinedProperties: true,
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

const OPPORTUNITIES_MAP = Object.fromEntries(
  Object.entries(mockOpportunityConfigs).map(([k, { firestoreCollection }]) => [
    `${k}Referrals`,
    firestoreCollection,
  ]),
) as Record<`${FixtureOpportunityType}Referrals`, string>;

type Logger = {
  (...data: any[]): void;
};

const GENERAL_FIXTURES_TO_LOAD: Partial<
  Record<FirestoreCollectionKey["key"] & string, FirestoreFixture<any>>
> = {
  ...mapValues<Record<string, ParsedRecord[]>, FirestoreFixture<ParsedRecord>>(
    {
      incarcerationStaff: incarcerationStaffFixtures,
      supervisionStaff: supervisionStaffFixtures,
    },
    (fixtures) => fixtureFromParsedRecords<ParsedRecord>("id", fixtures),
  ),
  clients: clientsData,
  residents: {
    idFunc: residentsData.idFunc,
    data: [...residentsData.data, ...rawUsMaResidents],
  },
  locations: locationsData,
  usIdSupervisionTasks: usIdSupervisionTasksData,
  usTxSupervisionTasks: usTxSupervisionTasksData,
} as const;

const OPPORTUNITY_FIXTURES_TO_LOAD: PartialRecord<
  keyof typeof OPPORTUNITIES_MAP,
  FirestoreFixture<any>
> = {
  ...mapValues<Record<string, FixtureMapping>, FirestoreFixture<ParsedRecord>>(
    {
      usMeSCCPReferrals: usMeSccpFixtures,
      usMeMediumTrusteeReferrals: usMeMediumTrusteeFixtures,
      usMeReclassificationReviewReferrals: usMeAnnualReclassificationFixtures,
      usMiReclassificationRequestReferrals: usMiReclassificationRequestFixtures,
      usMiSecurityClassificationCommitteeReviewReferrals:
        usMiSecurityClassificationCommitteeReviewFixtures,
      usMiWardenInPersonSecurityClassificationCommitteeReviewReferrals:
        usMiWardenInPersonSecurityClassificationCommitteeReviewFixtures,
      usMiAddInPersonSecurityClassificationCommitteeReviewReferrals:
        usMiAddInPersonSecurityClassificationCommitteeReviewFixtures,
      usPaSpecialCircumstancesSupervisionReferrals:
        usPaSpecialCircumstancesSupervisionFixtures,
    },
    (fixtures) => fixtureFromParsedRecords("externalId", fixtures),
  ),
  earlyTerminationReferrals: usNdEarlyTerminationFixture,
  pastFTRDReferrals: usIdPastFtrdFixture,
  earnedDischargeReferrals: earnedDischargeReferralsFixture,
  LSUReferrals: LSUReferralsFixture,
  supervisionLevelDowngradeReferrals: usTnSupervisionLevelDowngradeReferrals,
  usArInstitutionalWorkerStatusReferrals,
  usAzReleaseToTPRReferrals,
  usAzReleaseToDTPReferrals,
  usAzOverdueForACISDTPReferrals,
  usAzOverdueForACISTPRReferrals,
  usCaSupervisionLevelDowngradeReferrals,
  usIdCRCResidentWorkerReferrals,
  usIdCRCWorkReleaseReferrals,
  usIdExpandedCRCReferrals,
  usMoOverdueRestrictiveHousingReleaseReferrals,
  usIdSupervisionLevelDowngradeReferrals,
  usIdCustodyLevelDowngradeReferrals,
  usMeWorkReleaseReferrals,
  usMiEarlyDischargeReferrals: usMiEarlyDischargeReferralsFixture,
  usMiClassificationReviewReferrals: UsMiClassificationReviewReferralsFixture,
  usMiMinimumTelephoneReportingReferrals:
    usMiMinimumTelephoneReportingReferralsFixture,
  usMiSupervisionLevelDowngradeReferrals,
  usMiPastFTRDReferrals: usMiPastFTRDReferralsFixture,
  usMeEarlyTerminationReferrals: usMeEarlyTerminationReferralsFixture,
  usMeFurloughReleaseReferrals: usMeFurloughReleaseFixture,
  usPaAdminSupervisionReferrals,
  compliantReportingReferrals: usTnCompliantReportingReferrals,
  usTnCompliantReporting2025PolicyReferrals:
    usTnCompliantReporting2025PolicyReferrals,
  usTnCustodyLevelDowngradeReferrals: usTnCustodyLevelDowngradeFixture,
  usTnExpirationReferrals: usTnExpirationFixture,
  usTnAnnualReclassificationReferrals: usTnAnnualReclassificationReviewFixture,
  usTnSuspensionOfDirectSupervisionReferrals:
    usTnSuspensionOfDirectSupervisionFixture,
  usTnInitialClassificationReferrals: usTnInitialClassificationFixture,
  usMoOverdueRestrictiveHousingInitialHearingReferrals,
  usMoOverdueRestrictiveHousingReviewHearingReferrals,
  usUtEarlyTerminationReferrals,
  usIaEarlyDischargeReferrals: usIaEarlyDischargeReferralsFixture,
} as const;

const FIXTURES_TO_LOAD = [
  ...Object.entries(GENERAL_FIXTURES_TO_LOAD).map(
    ([k, v]) =>
      [{ key: k }, v] as [FirestoreCollectionKey, FirestoreFixture<any>],
  ),
  ...Object.entries(OPPORTUNITY_FIXTURES_TO_LOAD).map(
    ([k, v]) =>
      [
        {
          raw: OPPORTUNITIES_MAP[
            k as keyof typeof OPPORTUNITY_FIXTURES_TO_LOAD
          ],
        },
        v,
      ] as [FirestoreCollectionKey, FirestoreFixture<any>],
  ),
];

// If we're writing to the real firestore, don't clobber the real data
const collectionPrefix = FIREBASE_CREDENTIAL ? "DEMO" : null;

function generateCollectionName(c: FirestoreCollectionKey) {
  const collectionName = c.key
    ? FIRESTORE_GENERAL_COLLECTION_MAP[c.key]
    : c.raw;
  return collectionPrefix
    ? `${collectionPrefix}_${collectionName}`
    : collectionName;
}

export async function loadFixtures(logger: Logger): Promise<void> {
  for await (const [coll, fixtureData] of FIXTURES_TO_LOAD) {
    const collName = generateCollectionName(coll);
    logger(`wiping existing ${collName} data ...`);
    await deleteCollection(db, collName);

    logger(`loading new ${collName} data...`);
    const bulkWriter = db.bulkWriter();
    if (!fixtureData) throw new Error(`No fixture data for ${collName}`);
    // Iterate through each record
    fixtureData.data.forEach((record: any) => {
      const externalId = fixtureData.idFunc(record);
      bulkWriter.create(
        db
          .collection(collName)
          .doc(`${record.stateCode.toLowerCase()}_${externalId}`),
        record,
      );
    });

    bulkWriter
      .close()
      .then(() => logger(`new ${collName} data loaded successfully`));
  }
}

async function loadClientUpdatesV2(logger: Logger): Promise<void> {
  logger(`wiping existing clientUpdatesV2 data ...`);
  await deleteCollection(
    db,
    generateCollectionName({ key: "clientUpdatesV2" }),
  );

  const { milestonesMessages } = clientUpdatesV2Data;

  logger(`loading new milestonesMessages update data...`);
  const bulkWriter = db.bulkWriter();

  milestonesMessages.forEach(
    (record: MilestonesMessage & { externalId: string }) => {
      const { externalId } = record;
      bulkWriter.set(
        db
          .collection(generateCollectionName({ key: "clientUpdatesV2" }))
          .doc(externalId)
          .collection(FIRESTORE_GENERAL_COLLECTION_MAP.milestonesMessages)
          .doc(getMonthYearFromDate(new Date())),
        record,
      );
    },
  );
  bulkWriter
    .close()
    .then(() => logger(`new milestonesMessages data loaded successfully`));
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
  await Promise.all([loadFixtures(logger), loadClientUpdatesV2(logger)]);
}
