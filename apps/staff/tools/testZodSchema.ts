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

import { OpportunityType } from "../src/WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../src/WorkflowsStore/Opportunity/OpportunityConfigs";
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
import { usMoOverdueRestrictiveHousingInitialHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity/UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";
import { usMoOverdueRestrictiveHousingReleaseSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";
import { usMoOverdueRestrictiveHousingReviewHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity/UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";
import { usMoRestrictiveHousingStatusHearingSchema } from "../src/WorkflowsStore/Opportunity/UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
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

const SCHEMAS: Partial<Record<OpportunityType, z.ZodTypeAny>> = {
  compliantReporting: compliantReportingSchema,
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
  usMoRestrictiveHousingStatusHearing:
    usMoRestrictiveHousingStatusHearingSchema,
  usMeEarlyTermination: usMeEarlyTerminationSchema,
  usMiSupervisionLevelDowngrade:
    usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
      (s) => s,
    ),
  usMiClassificationReview:
    usMiClassificationReviewSchemaForSupervisionLevelFormatter(),
  usTnCustodyLevelDowngrade: usTnCustodyLevelDowngradeSchema,
  usTnExpiration: usTnExpirationSchema,
  usMeFurloughRelease: usMeFurloughReleaseSchema,
  usCaSupervisionLevelDowngrade: usCaSupervisionLevelDowngradeSchema,
  usMiEarlyDischarge: usMiEarlyDischargeSchema,
  usMiMinimumTelephoneReporting: usMiMinimumTelephoneReportingSchema,
  usTnAnnualReclassification: usTnAnnualReclassificationReviewSchema,
  usMeWorkRelease: usMeWorkReleaseSchema,
  usMoOverdueRestrictiveHousingRelease:
    usMoOverdueRestrictiveHousingReleaseSchema,
  usMoOverdueRestrictiveHousingInitialHearing:
    usMoOverdueRestrictiveHousingInitialHearingSchema,
  usMoOverdueRestrictiveHousingReviewHearing:
    usMoOverdueRestrictiveHousingReviewHearingSchema,
  usOrEarnedDischarge: usOrEarnedDischargeSchema,
};

async function testCollection(
  opportunityType: OpportunityType,
  limit?: number,
) {
  const schema = SCHEMAS[opportunityType];
  if (!schema) {
    throw new Error(`No schema found for ${opportunityType}`);
  }
  const coll = db.collection(
    OPPORTUNITY_CONFIGS[opportunityType].firestoreCollection,
  );
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
  Object.keys(SCHEMAS).forEach(async (oppType) => {
    const { failures, ...result } = await testCollection(
      oppType as OpportunityType,
    );
    // don't print failures so we don't leave PII in the github logs
    console.log(oppType, result);
    if (result.failed > 0) process.exit(1);
  });
}

async function manual(args: Args) {
  let opportunity;
  let limit;
  if (args.opportunity) {
    ({ opportunity, limit } = args);
  } else {
    ({ opportunity, limit } = await prompts([
      {
        type: "select",
        name: "opportunity",
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

  if (!(opportunity in SCHEMAS)) {
    console.error("Unrecognized collection name");
  }

  const { failures, ...result } = await testCollection(
    opportunity as OpportunityType,
    limit,
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
  help: "Test all opportunities",
});

parser.add_argument("-o", "--opportunity", {
  dest: "opportunity",
  default: null,
  help: "Test OPPORTUNITY",
});

parser.add_argument("-l", "--limit", {
  dest: "limit",
  type: "int",
  default: null,
  help: "Test only this many records (ignored by --all)",
});

type Args = {
  all: boolean;
  opportunity?: string;
  limit?: number;
};

const args = parser.parse_args() as Args;

if (args.all) {
  automatic();
} else {
  manual(args);
}
