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
import { ArgumentParser } from "argparse";
import prompts from "prompts";
import { z } from "zod";

import { FIRESTORE_COLLECTIONS_MAP } from "../src/FirestoreStore/constants";
import {
  FirestoreCollectionKey,
  FirestoreOpportunityReferrals,
} from "../src/FirestoreStore/types";
import { supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/SupervisionLevelDowngradeReferralRecord";
import { usCaSupervisionLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsCa/UsCaSupervisionLevelDowngradeOpportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { usIdCRCResidentWorkerSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCResidentWorkerOpportunity";
import { usIdCRCWorkReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import { usIdExpandedCRCSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdExpandedCRCOpportunity/UsIdExpandedCRCReferralRecord";
import { usIdPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdPastFTRDOpportunity/UsIdPastFTRDReferralRecord";
import { usMeEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeEarlyTerminationOpportunity/UsMeEarlyTerminationReferralRecord";
import { usMeFurloughReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeFurloughReleaseOpportunity/UsMeFurloughReleaseReferralRecord";
import { usMeSCCPSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeSCCPOpportunity/UsMeSCCPReferralRecord";
import { usMeWorkReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeWorkReleaseOpportunity/UsMeWorkReleaseReferralRecord";
import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiClassificationReviewOpportunity/UsMiClassificationReviewReferralRecord";
import { usMiEarlyDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiEarlyDischargeOpportunity/UsMiEarlyDischargeReferralRecord";
import { usMiMinimumTelephoneReportingSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiMinimumTelephoneReportingOpportunity/UsMiMinimumTelephoneReportingReferralRecord";
import { usMiPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiPastFTRDOpportunity/UsMiPastFTRDReferralRecord";
import { usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiSupervisionLevelDowngradeOpportunity/UsMiSupervisionLevelDowngradeReferralRecord";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";
import { usMoOverdueRestrictiveHousingReviewHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity";
import { usMoRestrictiveHousingStatusHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
import { usNdEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsNd/UsNdEarlyTerminationOpportunity/UsNdEarlyTerminationReferralRecord";
import { compliantReportingSchema } from "../src/WorkflowsStore/Opportunity/UsTn/CompliantReportingOpportunity/CompliantReportingReferralRecord";
import { usTnAnnualReclassificationReviewSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewReferralRecord";
import { usTnCustodyLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnCustodyLevelDowngradeOpportunity/UsTnCustodyLevelDowngradeReferralRecord";
import { usTnExpirationSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnExpirationOpportunity/UsTnExpirationReferralRecord";
import { usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnSupervisionLevelDowngradeOpportunity/UsTnSupervisionLevelDowngradeReferralRecord";

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

const db = getDb();

// TODO: Add to the config
const SCHEMAS: Partial<Record<FirestoreCollectionKey, z.ZodTypeAny>> = {
  compliantReportingReferrals: compliantReportingSchema,
  earlyTerminationReferrals: usNdEarlyTerminationSchema,
  pastFTRDReferrals: usIdPastFTRDSchema,
  usMiPastFTRDReferrals: usMiPastFTRDSchema,
  usMeSCCPReferrals: usMeSCCPSchema,
  usIdCRCResidentWorkerReferrals: usIdCRCResidentWorkerSchema,
  usIdCRCWorkReleaseReferrals: usIdCRCWorkReleaseSchema,
  usIdExpandedCRCReferrals: usIdExpandedCRCSchema,
  usIdSupervisionLevelDowngradeReferrals:
    supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  supervisionLevelDowngradeReferrals:
    usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  usMoRestrictiveHousingStatusHearingReferrals:
    usMoRestrictiveHousingStatusHearingSchema,
  usMeEarlyTerminationReferrals: usMeEarlyTerminationSchema,
  usMiSupervisionLevelDowngradeReferrals:
    usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
      (s) => s
    ),
  usMiClassificationReviewReferrals:
    usMiClassificationReviewSchemaForSupervisionLevelFormatter(),
  usTnCustodyLevelDowngradeReferrals: usTnCustodyLevelDowngradeSchema,
  usTnExpirationReferrals: usTnExpirationSchema,
  usMeFurloughReleaseReferrals: usMeFurloughReleaseSchema,
  usCaSupervisionLevelDowngradeReferrals: usCaSupervisionLevelDowngradeSchema,
  usMiEarlyDischargeReferrals: usMiEarlyDischargeSchema,
  usMiMinimumTelephoneReportingReferrals: usMiMinimumTelephoneReportingSchema,
  usTnAnnualReclassificationReferrals: usTnAnnualReclassificationReviewSchema,
  usMeWorkReleaseReferrals: usMeWorkReleaseSchema,
  usMoOverdueRestrictiveHousingReleaseReferrals:
    usMoOverdueRestrictiveHousingReleaseSchema,
  usMoOverdueRestrictiveHousingInitialHearingReferrals:
    usMoOverdueRestrictiveHousingInitialHearingSchema,
  usMoOverdueRestrictiveHousingReviewHearingReferrals:
    usMoOverdueRestrictiveHousingReviewHearingSchema,
};

async function testCollection(
  opportunityReferrals: FirestoreOpportunityReferrals,
  limit?: number
) {
  const schema = SCHEMAS[opportunityReferrals];
  if (!schema) {
    throw new Error(`No schema found for ${opportunityReferrals}`);
  }
  const coll = db.collection(FIRESTORE_COLLECTIONS_MAP[opportunityReferrals]);
  const query = limit ? coll.limit(limit) : coll;

  let succeeded = 0;
  let failed = 0;
  const failures: Record<string, z.ZodIssue[]> = {};
  (await query.get()).docs.forEach((d) => {
    const result = schema.safeParse(d.data());
    if (!result.success) {
      failed += 1;
      failures[d.id] = result.error.issues;
    } else {
      succeeded += 1;
    }
  });
  return { succeeded, failed, failures };
}

async function automatic() {
  Object.keys(SCHEMAS).forEach(async (schemaKey) => {
    const opportunityReferrals = schemaKey as FirestoreOpportunityReferrals;
    const { failures, ...result } = await testCollection(opportunityReferrals);
    // don't print failures so we don't leave PII in the github logs
    console.log(opportunityReferrals, result);
    if (result.failed > 0) process.exit(1);
  });
}

async function manual(args: Args) {
  let collection;
  let limit;
  if (args.collection) {
    ({ collection, limit } = args);
  } else {
    ({ collection, limit } = await prompts([
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
    ]));
  }

  if (!(collection in SCHEMAS)) {
    console.error("Unrecognized collection name");
  }

  const { failures, ...result } = await testCollection(
    collection as FirestoreOpportunityReferrals,
    limit
  );

  if (result.failed) console.log(JSON.stringify(failures, null, 2));
  console.log(result);
}

const parser = new ArgumentParser({
  description: "Test schemas against real firestore data",
});

parser.add_argument("-a", "--all", {
  dest: "all",
  action: "store_true",
  help: "Test all collections",
});

parser.add_argument("-c", "--collection", {
  dest: "collection",
  default: null,
  help: "Test COLLECTION",
});

parser.add_argument("-l", "--limit", {
  dest: "limit",
  type: "int",
  default: null,
  help: "Test only this many records (ignored by --all)",
});

type Args = {
  all: boolean;
  collection?: string;
  limit?: number;
};

const args = parser.parse_args() as Args;

if (args.all) {
  automatic();
} else {
  manual(args);
}
