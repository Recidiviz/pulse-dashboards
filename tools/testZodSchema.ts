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

import { collectionNames } from "../src/FirestoreStore";
import { compliantReportingSchema } from "../src/WorkflowsStore/Opportunity/CompliantReportingReferralRecord";
import { supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/SupervisionLevelDowngradeReferralRecord";
import { usCaSupervisionLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { usIdPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsIdPastFTRDReferralRecord";
import { usMeEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsMeEarlyTerminationReferralRecord";
import { usMeFurloughReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMeFurloughReleaseReferralRecord";
import { usMeSCCPSchema } from "../src/WorkflowsStore/Opportunity/UsMeSCCPReferralRecord";
import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMiClassificationReviewReferralRecord";
import { usMiEarlyDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsMiEarlyDischargeReferralRecord";
import { usMiMinimumTelephoneReportingSchema } from "../src/WorkflowsStore/Opportunity/UsMiMinimumTelephoneReportingReferralRecord";
import { usMiPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsMiPastFTRDReferralRecord";
import { usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMiSupervisionLevelDowngradeReferralRecord";
import { usMoRestrictiveHousingStatusHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
import { usNdEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsNdEarlyTerminationReferralRecord";
import { usTnCustodyLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsTnCustodyLevelDowngradeReferralRecord";
import { usTnExpirationSchema } from "../src/WorkflowsStore/Opportunity/UsTnExpirationReferralRecord";
import { usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsTnSupervisionLevelDowngradeReferralRecord";

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

const db = getDb();

const SCHEMAS = {
  compliantReportingReferrals: compliantReportingSchema,
  earlyTerminationReferrals: usNdEarlyTerminationSchema,
  pastFTRDReferrals: usIdPastFTRDSchema,
  usMiPastFTRDReferrals: usMiPastFTRDSchema,
  usMeSCCPReferrals: usMeSCCPSchema,
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
} satisfies Partial<Record<CollectionName, z.ZodTypeAny>>;

async function testCollection(
  collectionName: keyof typeof SCHEMAS,
  limit?: number
) {
  const schema = SCHEMAS[collectionName];
  const coll = db.collection(collectionNames[collectionName]);
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
  Object.keys(SCHEMAS).forEach(async (collection) => {
    const collectionName = collection as keyof typeof SCHEMAS;
    const { failures, ...result } = await testCollection(collectionName);
    // don't print failures so we don't leave PII in the github logs
    console.log(collectionName, result);
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
    collection as keyof typeof SCHEMAS,
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
