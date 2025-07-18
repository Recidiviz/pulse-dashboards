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
  usMeWorkReleaseSchema,
  usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
  usMiSecurityClassificationCommitteeReviewSchema,
  usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
  usPaSpecialCircumstancesSupervisionSchema,
} from "~datatypes";

import { mockOpportunityConfigs } from "../src/core/__tests__/testUtils";
import { supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/SupervisionLevelDowngradeReferralRecord";
import { usArInstitutionalWorkerStatusSchema } from "../src/WorkflowsStore/Opportunity/UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusReferralRecord";
import { usAzReleaseToTPRSchema } from "../src/WorkflowsStore/Opportunity/UsAz";
import { usAzOverdueForAcisDtpSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisDtpOpportunity/UsAzOverdueForAcisDtpReferralRecord";
import { usAzOverdueForAcisTprSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisTprOpportunity/UsAzOverdueForAcisTprReferralRecord";
import { usAzReleaseToDTPSchema } from "../src/WorkflowsStore/Opportunity/UsAz/UsAzReleaseToDTPOpportunity/UsAzReleaseToDTPReferralRecord";
import { usCaSupervisionLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsCa/UsCaSupervisionLevelDowngradeOpportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { usIaEarlyDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsIa";
import { usIdEarnedDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsId/EarnedDischargeOpportunity";
import { usIdLsuSchema } from "../src/WorkflowsStore/Opportunity/UsId/LSUOpportunity";
import { usIdCRCResidentWorkerSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCResidentWorkerOpportunity";
import { usIdCRCWorkReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import { usIdCustodyLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdCustodyLevelDowngradeOpportunity/UsIdCustodyLevelDowngradeReferralRecord";
import { usIdExpandedCRCSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdExpandedCRCOpportunity/UsIdExpandedCRCReferralRecord";
import { usIdPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsId/UsIdPastFTRDOpportunity/UsIdPastFTRDReferralRecord";
import { usMeEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeEarlyTerminationOpportunity/UsMeEarlyTerminationReferralRecord";
import { usMeFurloughReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMe/UsMeFurloughReleaseOpportunity/UsMeFurloughReleaseReferralRecord";
import { usMiClassificationReviewSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiClassificationReviewOpportunity/UsMiClassificationReviewReferralRecord";
import { usMiEarlyDischargeSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiEarlyDischargeOpportunity/UsMiEarlyDischargeReferralRecord";
import { usMiMinimumTelephoneReportingSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiMinimumTelephoneReportingOpportunity/UsMiMinimumTelephoneReportingReferralRecord";
import { usMiPastFTRDSchema } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiPastFTRDOpportunity/UsMiPastFTRDReferralRecord";
import { usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsMi/UsMiSupervisionLevelDowngradeOpportunity/UsMiSupervisionLevelDowngradeReferralRecord";
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity/UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";
import { usMoOverdueRestrictiveHousingReviewHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity/UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";
import { usNdEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsNd/UsNdEarlyTerminationOpportunity/UsNdEarlyTerminationReferralRecord";
import { usOrEarnedDischargeSentenceSchema } from "../src/WorkflowsStore/Opportunity/UsOr/UsOrEarnedDischargeSentenceOpportunity";
import { usPaAdminSupervisionSchema } from "../src/WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import { compliantReportingSchema } from "../src/WorkflowsStore/Opportunity/UsTn/CompliantReportingOpportunity/CompliantReportingReferralRecord";
import { usTnAnnualReclassificationReviewSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewReferralRecord";
import { usTnCompliantReporting2025PolicySchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnCompliantReporting2025PolicyOpportunity";
import { usTnCustodyLevelDowngradeSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnCustodyLevelDowngradeOpportunity/UsTnCustodyLevelDowngradeReferralRecord";
import { usTnExpirationSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnExpirationOpportunity/UsTnExpirationReferralRecord";
import { usTnInitialClassificationSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnInitialClassificationOpportunity/UsTnInitialClassificationReferralRecord";
import { usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnSupervisionLevelDowngradeOpportunity/UsTnSupervisionLevelDowngradeReferralRecord";
import { usTnSuspensionOfDirectSupervisionSchema } from "../src/WorkflowsStore/Opportunity/UsTn/UsTnSuspensionOfDirectSupervisionOpportunity/UsTnSuspensionOfDirectSupervisionReferralRecord";
import { usUtEarlyTerminationSchema } from "../src/WorkflowsStore/Opportunity/UsUt";

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
  // US_AR
  usArInstitutionalWorkerStatus: usArInstitutionalWorkerStatusSchema,

  // US_AZ
  usAzReleaseToTPR: usAzReleaseToTPRSchema,
  usAzReleaseToDTP: usAzReleaseToDTPSchema,
  usAzOverdueForACISTPR: usAzOverdueForAcisTprSchema,
  usAzOverdueForACISDTP: usAzOverdueForAcisDtpSchema,

  // US_CA
  usCaSupervisionLevelDowngrade: usCaSupervisionLevelDowngradeSchema,

  // US_IA
  usIaEarlyDischarge: usIaEarlyDischargeSchema,

  // US_ID
  earnedDischarge: usIdEarnedDischargeSchema,
  LSU: usIdLsuSchema,
  pastFTRD: usIdPastFTRDSchema,
  usIdCRCResidentWorker: usIdCRCResidentWorkerSchema,
  usIdCRCWorkRelease: usIdCRCWorkReleaseSchema,
  usIdExpandedCRC: usIdExpandedCRCSchema,
  usIdCustodyLevelDowngrade: usIdCustodyLevelDowngradeSchema,
  usIdSupervisionLevelDowngrade:
    supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),

  // US_ME
  usMeEarlyTermination: usMeEarlyTerminationSchema,
  usMeFurloughRelease: usMeFurloughReleaseSchema,
  usMeMediumTrustee: usMeMediumTrusteeSchema,
  usMeReclassificationReview: usMeAnnualReclassificationSchema,
  usMeSCCP: usMeSCCPSchema,
  usMeWorkRelease: usMeWorkReleaseSchema,

  // US_MI
  usMiPastFTRD: usMiPastFTRDSchema,
  usMiSupervisionLevelDowngrade:
    usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  usMiClassificationReview:
    usMiClassificationReviewSchemaForSupervisionLevelFormatter(),
  usMiEarlyDischarge: usMiEarlyDischargeSchema,
  usMiMinimumTelephoneReporting: usMiMinimumTelephoneReportingSchema,
  usMiAddInPersonSecurityClassificationCommitteeReview:
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewSchema,
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,

  // US_MO
  usMoOverdueRestrictiveHousingRelease:
    usMoOverdueRestrictiveHousingReleaseSchema,
  usMoOverdueRestrictiveHousingInitialHearing:
    usMoOverdueRestrictiveHousingInitialHearingSchema,
  usMoOverdueRestrictiveHousingReviewHearing:
    usMoOverdueRestrictiveHousingReviewHearingSchema,

  // US_ND
  earlyTermination: usNdEarlyTerminationSchema,

  // US_OR
  usOrEarnedDischargeSentence: usOrEarnedDischargeSentenceSchema,

  // US_PA
  usPaAdminSupervision: usPaAdminSupervisionSchema,
  usPaSpecialCircumstancesSupervision:
    usPaSpecialCircumstancesSupervisionSchema,

  // US_TN
  compliantReporting: compliantReportingSchema,
  usTnCompliantReporting2025Policy: usTnCompliantReporting2025PolicySchema,
  supervisionLevelDowngrade:
    usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(),
  usTnAnnualReclassification: usTnAnnualReclassificationReviewSchema,
  usTnCustodyLevelDowngrade: usTnCustodyLevelDowngradeSchema,
  usTnExpiration: usTnExpirationSchema,
  usTnInitialClassification: usTnInitialClassificationSchema,
  usTnSuspensionOfDirectSupervision: usTnSuspensionOfDirectSupervisionSchema,

  // US_UT
  usUtEarlyTermination: usUtEarlyTerminationSchema,
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
  isOpportunity?: boolean;
} {
  if (key in OPPORTUNITY_SCHEMAS) {
    const schema = OPPORTUNITY_SCHEMAS[key as OpportunityType];
    if (!schema) {
      throw new Error(`No schema found for ${key}`);
    }
    const { firestoreCollection } =
      mockOpportunityConfigs[key as OpportunityType];
    return { schema, firestoreCollection, isOpportunity: true };
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

function validateDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot,
  schema: z.ZodTypeAny,
  firestoreCollection: string,
  isOpportunity?: boolean,
) {
  const raw = doc.data();
  // The client schema expects the record id to be injected
  if (firestoreCollection === "clients" || firestoreCollection === "residents")
    raw.recordId = "stub";
  if (isOpportunity) {
    // To ensure that opportunity schemas pass through criteria they don't recognize,
    // we inject these additional criteria and check that they're still there after the
    // schema parses.
    raw.eligibleCriteria.PASSTHROUGH_NULL = null;
    raw.eligibleCriteria.PASSTHROUGH_OBJ = { test: "valid" };
    raw.ineligibleCriteria.INELIGIBLE_PASSTHROUGH_NULL = null;
    raw.ineligibleCriteria.INELIGIBLE_PASSTHROUGH_OBJ = { test: "valid" };
  }
  return isOpportunity
    ? schema.pipe(opportunityPassthroughTestSchema).safeParse(raw)
    : schema.safeParse(raw);
}

async function testCollection(opportunityType: SchemaKey, stateCode?: string) {
  const { schema, firestoreCollection, isOpportunity } =
    getTestParams(opportunityType);
  const coll = db.collection(firestoreCollection);

  let succeeded = 0;
  let failed = 0;
  const failures: Record<string, z.ZodIssue[]> = {};

  const chunkSize = 1000;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    // Build query for current chunk
    let query = coll.limit(chunkSize);
    if (stateCode) {
      query = query.where("stateCode", "==", stateCode);
    }
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // eslint-disable-next-line no-await-in-loop
    const snapshot = await query.get();
    const docs = snapshot.docs;

    if (docs.length === 0) {
      hasMore = false;
      break;
    }

    // Process current chunk
    for (const d of docs) {
      const result = validateDocument(
        d,
        schema,
        firestoreCollection,
        isOpportunity,
      );
      if (result.success) {
        succeeded += 1;
      } else {
        failed += 1;
        if (result.error.issues) {
          failures[d.id] = result.error.issues;
        }
      }
    }

    // Check for failures after processing the chunk
    if (failed > 0) {
      return { succeeded, failed, failures };
    }

    console.log(`Checked ${succeeded} records...`);

    // Set up for next iteration
    lastDoc = docs[docs.length - 1];
    hasMore = docs.length === chunkSize;
  }

  return { succeeded, failed, failures };
}

async function automatic({ stateCode }: Args) {
  Object.keys(ALL_SCHEMAS).forEach(async (schemaKey) => {
    const { failures, ...result } = await testCollection(
      schemaKey as SchemaKey,
      stateCode,
    );
    // don't print failures so we don't leave PII in the github logs
    console.log(result.failed ? "❌" : "✅", schemaKey, result);
    if (result.failed > 0) process.exitCode = 1;
  });
}

async function manual(args: Args) {
  let schemaKey;
  let stateCode = args.stateCode;
  if (args.schemaKey) {
    ({ schemaKey } = args);
  } else {
    ({ schemaKey } = await prompts([
      {
        type: "select",
        name: "schemaKey",
        message: `schema you want to test against ${FIREBASE_PROJECT}`,
        choices: Object.keys(ALL_SCHEMAS).map((k) => ({
          title: k,
          value: k,
        })),
      },
    ]));
  }

  if (!(schemaKey in ALL_SCHEMAS)) {
    console.error("Unrecognized collection name");
  }

  if (!stateCode && schemaKey in OTHER_SCHEMAS) {
    const { maybeStateCode } = await prompts([
      {
        type: "text",
        name: "maybeStateCode",
        message: "Enter a state code to filter by, or leave blank for all",
      },
    ]);
    if (maybeStateCode.length > 0) {
      stateCode = maybeStateCode.toUpperCase();
    }
  }

  const { failures, ...result } = await testCollection(
    schemaKey as SchemaKey,
    stateCode,
  );

  if (result.failed) {
    console.log(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else if (result.succeeded === 0) {
    console.log(
      "Found no records to test! Either the collection is empty or the state code filter didn't match anything.",
    );
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

parser.add_argument("--state_code", {
  dest: "stateCode",
  default: null,
  help: "Only test STATE_CODE",
});

type Args = {
  all: boolean;
  schemaKey?: string;
  stateCode?: string;
};

const args = parser.parse_args() as Args;

if (args.all) {
  automatic(args);
} else {
  manual(args);
}
