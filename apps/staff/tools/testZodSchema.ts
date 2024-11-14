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
import { ArgumentParser } from "argparse";
import prompts from "prompts";
import { z } from "zod";

import {
  clientRecordSchema,
  incarcerationStaffRecordSchema,
  OpportunityType,
  residentRecordSchema,
  supervisionStaffRecordSchema,
  usMeAnnualReclassificationSchema,
  usMeMediumTrusteeSchema,
  usMeSCCPSchema,
  usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
  usMiSecurityClassificationCommitteeReviewSchema,
  usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
} from "~datatypes";

import { mockOpportunityConfigs } from "../src/core/__tests__/testUtils";
import { supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/SupervisionLevelDowngradeReferralRecord";
import { usAzReleaseToTPRSchema } from "../src/WorkflowsStore/Opportunity/UsAz";
import { usAzOverdueForAcisDtpSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisDtpOpportunity/UsAzOverdueForAcisDtpReferralRecord";
import { usAzOverdueForAcisTprSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisTprOpportunity/UsAzOverdueForAcisTprReferralRecord";
import { usAzReleaseToDTPSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzReleaseToDTPReferralRecord";
import { usCaSupervisionLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsCa/UsCaSupervisionLevelDowngradeOpportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { usIdEarnedDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsId/EarnedDischargeOpportunity";
import { usIdLsuSchema } from "../src/WorkflowsStore/Opportunity/UsId/LSUOpportunity";
import { usIdCRCResidentWorkerSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCResidentWorkerOpportunity";
import { usIdCRCWorkReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import { usIdExpandedCRCSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdExpandedCRCOpportunity/UsIdExpandedCRCReferralRecord";
import { usIdPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdPastFTRDOpportunity/UsIdPastFTRDReferralRecord";
import { usMeEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeEarlyTerminationOpportunity/UsMeEarlyTerminationReferralRecord";
import { usMeFurloughReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeFurloughReleaseOpportunity/UsMeFurloughReleaseReferralRecord";
import { usMeWorkReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeWorkReleaseOpportunity/UsMeWorkReleaseReferralRecord";
import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiClassificationReviewOpportunity/UsMiClassificationReviewReferralRecord";
import { usMiEarlyDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiEarlyDischargeOpportunity/UsMiEarlyDischargeReferralRecord";
import { usMiMinimumTelephoneReportingSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiMinimumTelephoneReportingOpportunity/UsMiMinimumTelephoneReportingReferralRecord";
import { usMiPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiPastFTRDOpportunity/UsMiPastFTRDReferralRecord";
import { usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiSupervisionLevelDowngradeOpportunity/UsMiSupervisionLevelDowngradeReferralRecord";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity/UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";
import { usMoOverdueRestrictiveHousingReviewHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity/UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";
import { usNdEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsNd/UsNdEarlyTerminationOpportunity/UsNdEarlyTerminationReferralRecord";
import { usOrEarnedDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsOr/UsOrEarnedDischargeOpportunity/UsOrEarnedDischargeReferralRecord";
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

const OPPORTUNITY_SCHEMAS: Partial<Record<OpportunityType, z.ZodTypeAny>> = {
  compliantReporting: compliantReportingSchema,
  earnedDischarge: usIdEarnedDischargeSchema,
  LSU: usIdLsuSchema,
  earlyTermination: usNdEarlyTerminationSchema,
  pastFTRD: usIdPastFTRDSchema,
  usMiPastFTRD: usMiPastFTRDSchema,
  usMeSCCP: usMeSCCPSchema,
  usIdCRCResidentWorker: usIdCRCResidentWorkerSchema,
  usIdCRCWorkRelease: usIdCRCWorkReleaseSchema,
  usIdExpandedCRC: usIdExpandedCRCSchema,
  usIdSupervisionLevelDowngrade:
    supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  supervisionLevelDowngrade:
    usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  usMeEarlyTermination: usMeEarlyTerminationSchema,
  usMiSupervisionLevelDowngrade:
    usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  usMiClassificationReview:
    usMiClassificationReviewSchemaForSupervisionLevelFormatter(),
  usTnCustodyLevelDowngrade: usTnCustodyLevelDowngradeSchema,
  usTnExpiration: usTnExpirationSchema,
  usMeFurloughRelease: usMeFurloughReleaseSchema,
  usCaSupervisionLevelDowngrade: usCaSupervisionLevelDowngradeSchema,
  usMiEarlyDischarge: usMiEarlyDischargeSchema,
  usMiMinimumTelephoneReporting: usMiMinimumTelephoneReportingSchema,
  usMiAddInPersonSecurityClassificationCommitteeReview:
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewSchema,
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
  usTnAnnualReclassification: usTnAnnualReclassificationReviewSchema,
  usMeWorkRelease: usMeWorkReleaseSchema,
  usMoOverdueRestrictiveHousingRelease:
    usMoOverdueRestrictiveHousingReleaseSchema,
  usMoOverdueRestrictiveHousingInitialHearing:
    usMoOverdueRestrictiveHousingInitialHearingSchema,
  usMoOverdueRestrictiveHousingReviewHearing:
    usMoOverdueRestrictiveHousingReviewHearingSchema,
  usOrEarnedDischarge: usOrEarnedDischargeSchema,
  usOrEarnedDischargeSentence: usOrEarnedDischargeSchema,
  usMeReclassificationReview: usMeAnnualReclassificationSchema,
  usMeMediumTrustee: usMeMediumTrusteeSchema,
  usAzReleaseToTPR: usAzReleaseToTPRSchema,
  usAzReleaseToDTP: usAzReleaseToDTPSchema,
  usAzOverdueForACISTPR: usAzOverdueForAcisTprSchema,
  usAzOverdueForACISDTP: usAzOverdueForAcisDtpSchema,
};

const OTHER_SCHEMAS = {
  residents: {
    schema: residentRecordSchema,
    firestoreCollection: "residents",
  },
  incarcerationStaff: {
    schema: incarcerationStaffRecordSchema,
    firestoreCollection: "incarcerationStaff",
  },
  supervisionStaff: {
    schema: supervisionStaffRecordSchema,
    firestoreCollection: "supervisionStaff",
  },
  clients: {
    schema: clientRecordSchema,
    firestoreCollection: "clients",
  },
};

type SchemaKey = keyof typeof OPPORTUNITY_SCHEMAS | keyof typeof OTHER_SCHEMAS;

function getTestParams(key: SchemaKey): {
  schema: z.ZodTypeAny;
  firestoreCollection: string;
} {
  if (key in OPPORTUNITY_SCHEMAS) {
    const schema = OPPORTUNITY_SCHEMAS[key as OpportunityType];
    if (!schema) {
      throw new Error(`No schema found for ${key}`);
    }
    const { firestoreCollection } =
      mockOpportunityConfigs[key as OpportunityType];
    return { schema, firestoreCollection };
  }
  if (key in OTHER_SCHEMAS) {
    return OTHER_SCHEMAS[key as keyof typeof OTHER_SCHEMAS];
  }
  throw new Error(`No schema found for ${key}`);
}

const ALL_SCHEMAS = { ...OTHER_SCHEMAS, ...OPPORTUNITY_SCHEMAS };

const opportunityPassthroughTestSchema = z.object({
  eligibleCriteria: z.object({
    PASSTHROUGH_NULL: z.null(),
    PASSTHROUGH_OBJ: z.object({ test: z.literal("valid") }),
  }),
  ineligibleCriteria: z.object({
    INELIGIBLE_PASSTHROUGH_NULL: z.null(),
    INELIGIBLE_PASSTHROUGH_OBJ: z.object({ test: z.literal("valid") }),
  }),
});

async function testCollection(opportunityType: SchemaKey, limit?: number) {
  const { schema, firestoreCollection } = getTestParams(opportunityType);
  const coll = db.collection(firestoreCollection);
  const query = limit ? coll.limit(limit) : coll;

  let succeeded = 0;
  let failed = 0;
  const failures: Record<string, z.ZodIssue[]> = {};
  (await query.get()).docs.forEach((d) => {
    const raw = d.data();
    // TODO(#6666) Remove the exception for AZ DTP opportunity, whose eligible criteria
    // can be either an empty object or an object with specific keys so we can't use passthrough
    const isOpportunity =
      !!raw.eligibleCriteria && opportunityType !== "usAzReleaseToDTP";
    if (isOpportunity) {
      raw.eligibleCriteria.PASSTHROUGH_NULL = null;
      raw.eligibleCriteria.PASSTHROUGH_OBJ = { test: "valid" };
      raw.ineligibleCriteria.INELIGIBLE_PASSTHROUGH_NULL = null;
      raw.ineligibleCriteria.INELIGIBLE_PASSTHROUGH_OBJ = { test: "valid" };
    }
    const result = isOpportunity
      ? schema.pipe(opportunityPassthroughTestSchema).safeParse(raw)
      : schema.safeParse(raw);
    if (result.success) {
      succeeded += 1;
    } else {
      failed += 1;
      failures[d.id] = result.error.issues;
    }
  });
  return { succeeded, failed, failures };
}

async function automatic({ limit }: Args) {
  Object.keys(ALL_SCHEMAS).forEach(async (schemaKey) => {
    const { failures, ...result } = await testCollection(
      schemaKey as SchemaKey,
      limit,
    );
    // don't print failures so we don't leave PII in the github logs
    console.log(result.failed ? "❌" : "✅", schemaKey, result);
    if (result.failed > 0) process.exitCode = 1;
  });
}

async function manual(args: Args) {
  let schemaKey;
  let limit;
  if (args.schemaKey) {
    ({ schemaKey, limit } = args);
  } else {
    ({ schemaKey, limit } = await prompts([
      {
        type: "select",
        name: "schemaKey",
        message: `schema you want to test against ${FIREBASE_PROJECT}`,
        choices: Object.keys(ALL_SCHEMAS).map((k) => ({
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

  if (!(schemaKey in ALL_SCHEMAS)) {
    console.error("Unrecognized collection name");
  }

  const { failures, ...result } = await testCollection(
    schemaKey as SchemaKey,
    limit,
  );

  if (result.failed) {
    console.log(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
  console.log(result);
}

const parser = new ArgumentParser({
  description: "Test schemas against real firestore data",
});

parser.add_argument("-a", "--all", {
  dest: "all",
  action: "store_true",
  help: "Test all schemas",
});

parser.add_argument("-s", "--schema", {
  dest: "schemaKey",
  default: null,
  help: "Test SCHEMA",
});

parser.add_argument("-l", "--limit", {
  dest: "limit",
  type: "int",
  default: null,
  help: "Test only this many records (ignored by --all)",
});

type Args = {
  all: boolean;
  schemaKey?: string;
  limit?: number;
};

const args = parser.parse_args() as Args;

if (args.all) {
  automatic(args);
} else {
  manual(args);
}
