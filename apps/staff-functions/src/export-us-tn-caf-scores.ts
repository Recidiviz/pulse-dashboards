// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { Firestore } from "@google-cloud/firestore";
import { firestore } from "firebase-admin";
import { Pool } from "pg";

import {
  deriveDcafFormData,
  deriveRcafFormData,
  OpportunityType,
  prefillDcafFormData,
  prefillRcafFormData,
  RawResidentRecord,
  TRUSTEE_FORM_QUESTION_ORDER,
  UsTnInitialClassification2026DraftData,
  usTnInitialClassification2026Schema,
  UsTnReclassification2026DraftData,
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "~datatypes";

import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;
import { isValid, subHours } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { defineJsonSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";

const LOOKBACK_HOURS = 2;
const persistenceDbConfigSecrets = defineJsonSecret("PERSISTENCE_DB_CONFIG");

const EXECUTION_OPTIONS = {
  // Run every 20 minutes
  // If you edit this, please check your cron syntax with a tool
  // such as https://crontab.guru/#*/20_*_*_*_*
  schedule: "*/20 * * * *",
  // Allow 5 minutes for it to run
  timeoutSeconds: 300,
  secrets: [persistenceDbConfigSecrets],
};

type DocData = {
  data?: Partial<UsTnReclassification2026DraftData>;
  updated: {
    date: Timestamp;
    by: string;
  };
};

const getTrusteeQuestionValue = (data: DocData["data"], index: number) => {
  switch (data?.[TRUSTEE_FORM_QUESTION_ORDER[index]]) {
    case "true":
      return "T";
    case "false":
      return "F";
  }
  return undefined;
};

function removeNewlines(input: string | undefined): string | undefined {
  return input?.replaceAll("\n", "; ");
}

function validateDate(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;

  if (!isValid(new Date(input))) return undefined;

  return input;
}

// This record defines a map from fields in the combined draft record to output
// fields with minimal transformation or need to map dependencies.
const COLUMN_MAPPING: Record<
  string,
  (
    data: Partial<UsTnReclassification2026DraftData>,
  ) => string | number | boolean | undefined
> = {
  Trustee_Question1: (doc) => getTrusteeQuestionValue(doc, 0),
  Trustee_Question2: (doc) => getTrusteeQuestionValue(doc, 1),
  Trustee_Question3: (doc) => getTrusteeQuestionValue(doc, 2),
  Trustee_Question4: (doc) => getTrusteeQuestionValue(doc, 3),
  Trustee_Question5: (doc) => getTrusteeQuestionValue(doc, 4),
  Trustee_Question6: (doc) => getTrusteeQuestionValue(doc, 5),
  Trustee_Question7: (doc) => getTrusteeQuestionValue(doc, 6),
  Trustee_Question8: (doc) => getTrusteeQuestionValue(doc, 7),
  Trustee_Question9: (doc) => getTrusteeQuestionValue(doc, 8),
  Trustee_Question10: (doc) => getTrusteeQuestionValue(doc, 9),
  Trustee_Question11: (doc) => getTrusteeQuestionValue(doc, 10),
  Trustee_Question12: (doc) => getTrusteeQuestionValue(doc, 11),
  Trustee_Question13: (doc) => getTrusteeQuestionValue(doc, 12),

  CounselorRecommendedOverride: (doc) => doc["counselorRecommendedOverride"],
  CounselorRecommendedCustodyLevel: (doc) => doc["counselorRecommendedCustody"],
  FinalOverrideCode: (doc) => doc["recommendationOverrideType"],
  FinalCustodyLevel: (doc) => doc["recommendationCustodyLevel"],

  TrusteeApprovedOrDenied: (doc) => doc["trusteeCustodyApproved"],
  TrusteeDenialReasons: (doc) => doc["trusteeDenialReasons"],
  ChiefCounselorFinalizingForm: (doc) => doc["finalizingCounselor"],
  DateOfFinalApprovalAndEntry: (doc) => validateDate(doc["finalApprovalDate"]),

  Question1_notes: (doc) =>
    removeNewlines(doc["q1aNotes"] + "; " + doc["q1bNotes"]),
  Question2_notes: (doc) => removeNewlines(doc["q2Notes"]),
  Question3_notes: (doc) => removeNewlines(doc["q3NotesFormatted"]),
  Question4_notes: (doc) => removeNewlines(doc["q4NotesFormatted"]),
  Question5_notes: (doc) => removeNewlines(doc["q5NotesFormatted"]),
  Question7_notes: (doc) => removeNewlines(doc["q7Notes"]),

  TrusteeChecklistComplete: (doc) =>
    doc["trusteeNoFelonyDetainers"] !== undefined &&
    doc["trusteeNoPendingFelonyCharges"] !== undefined &&
    doc["trusteeNoPendingImmigrationActions"] !== undefined &&
    doc["trusteeWardenHasApproved"] !== undefined
      ? "Y"
      : "N",

  Warden_TrusteeSignaturesAcquired: (doc) => doc["trusteeWardenSignature"],
  Warden_TrusteeSignaturesAcquiredDate: (doc) =>
    validateDate(doc["trusteeWardenSignatureDate"]),
  ContractMonitor_TrusteeSignaturesAcquired: (doc) => doc["trusteeCMSignature"],
  ContractMonitor_TrusteeSignaturesAcquiredDate: (doc) =>
    validateDate(doc["trusteeCMSignatureDate"]),
  AC_TrusteeSignaturesAcquired: (doc) => doc["trusteeACSignature"],
  AC_TrusteeSignaturesAcquiredDate: (doc) =>
    validateDate(doc["trusteeACSignatureDate"]),
};

// We can combine the RCAF and DCAF fields into one list since we are
// just checking to see if any of these are populated, not all.
const allScoredQuestionFields = [
  "q1Selection",
  "q2Selection",
  "q3Selection",
  "q4Selection",
  "q5Selection",
  "q3Selection_0_6",
  "q3Selection_6_12",
  "q4Selection_0_6",
  "q4Selection_6_12",
  "q5Selection_0_6",
  "q5Selection_6_12",
  "q5Selection_12_18",
  "q5Selection_18_36",
  "q5Selection_36_60",
  "q6Selection",
  "q7Selection",
] as const;

// This record maps output fields to their source field in the derived data blob
// as well as which fields affect that field. This allows us to determine
// when a field was changed by the update record and record the output
type DerivedDataMapping = Record<
  string,
  {
    sourceField: keyof ReturnType<typeof deriveRcafFormData>;
    relevantFields: readonly (keyof (UsTnReclassification2026DraftData &
      UsTnInitialClassification2026DraftData))[];
  }
>;

const DERIVED_DATA_MAPPING_DCAF: DerivedDataMapping = {
  Question1: { sourceField: "q1Score", relevantFields: ["q1Selection"] },
  Question2: { sourceField: "q2Score", relevantFields: ["q2Selection"] },
  Question3: { sourceField: "q3Score", relevantFields: ["q3Selection"] },
  Question4: { sourceField: "q4Score", relevantFields: ["q4Selection"] },
  Question5: { sourceField: "q5Score", relevantFields: ["q5Selection"] },
  Question6: { sourceField: "q6Score", relevantFields: ["q6Selection"] },
  Question7: { sourceField: "q7Score", relevantFields: ["q7Selection"] },
  OverallScore: {
    sourceField: "totalScore",
    relevantFields: allScoredQuestionFields,
  },
  ScoredCustodyLevel: {
    sourceField: "totalText",
    relevantFields: allScoredQuestionFields,
  },

  TrusteeEligible: {
    sourceField: "trusteeEligible",
    relevantFields: TRUSTEE_FORM_QUESTION_ORDER,
  },
};

const DERIVED_DATA_MAPPING_RCAF: DerivedDataMapping = {
  ...DERIVED_DATA_MAPPING_DCAF,
  Question3: {
    sourceField: "q3Score",
    relevantFields: ["q3Selection_0_6", "q3Selection_6_12"],
  },
  Question4: {
    sourceField: "q4Score",
    relevantFields: ["q4Selection_0_6", "q4Selection_6_12"],
  },
  Question5: {
    sourceField: "q5Score",
    relevantFields: [
      "q5Selection_0_6",
      "q5Selection_6_12",
      "q5Selection_12_18",
      "q5Selection_18_36",
      "q5Selection_36_60",
    ],
  },
};

const CSV_COLUMN_ORDER = [
  "state_code",
  "OFFENDERID",
  "ClassificationType",
  "ClassificationFormType",
  "AssessmentDate",
  "LastClassificationDate",
  "LastModifiedBy",
  "Question1",
  "Question1_notes",
  "Question2",
  "Question2_notes",
  "Question3",
  "Question3_notes",
  "Question4",
  "Question4_notes",
  "Question5",
  "Question5_notes",
  "Question6",
  "Question6_notes",
  "Question7",
  "Question7_notes",
  "OverallScore",
  "ScoredCustodyLevel",
  "CounselorRecommendedOverride",
  "CounselorRecommendedCustodyLevel",
  "FinalOverrideCode",
  "FinalCustodyLevel",
  "DateOfApprovalAndEntry_CAF",
  "TrusteeFlag",
  "Trustee_Question1",
  "Trustee_Question2",
  "Trustee_Question3",
  "Trustee_Question4",
  "Trustee_Question5",
  "Trustee_Question6",
  "Trustee_Question7",
  "Trustee_Question8",
  "Trustee_Question9",
  "Trustee_Question10",
  "Trustee_Question11",
  "Trustee_Question12",
  "Trustee_Question13",
  "DateOfApprovalAndEntry_Trustee",
  "TrusteeApprovedOrDenied",
  "TrusteeEligible",
  "TrusteeDenialReasons",
  "Warden_TrusteeSignaturesAcquired",
  "Warden_TrusteeSignaturesAcquiredDate",
  "ContractMonitor_TrusteeSignaturesAcquired",
  "ContractMonitor_TrusteeSignaturesAcquiredDate",
  "AC_TrusteeSignaturesAcquired",
  "AC_TrusteeSignaturesAcquiredDate",
  "ChiefCounselorFinalizingForm",
  "TrusteeChecklistComplete",
  "DateOfFinalApprovalAndEntry",
  "LastModifiedDate",
  "UpdatedFields",
  "SummaryTrusteeEverConvictedOfFirstDegreeMurder",
  "SummaryTrusteeServingLifeSentence",
  "SummaryTrusteeMoreThan10YearRemaining",
  "SummaryTrusteeAllNoTrusteeCompleted",
];

function processRecord(
  opportunityType: OpportunityType,
  personRecordKey: string,
  updateSnapshot: QueryDocumentSnapshot<DocData>,
  baseSnapshot: QueryDocumentSnapshot<
    UsTnReclassification2026ReferralRecord["output"]
  >,
  personSnapshot: QueryDocumentSnapshot<RawResidentRecord>,
) {
  // Set up an output record
  const out: Record<
    string,
    string | string[] | number | boolean | undefined | null
  > = {};

  // Set flag to use dcaf vs rcaf helpers
  const isDcaf = opportunityType === "usTnInitialClassification2026Policy";

  // Pull data from the firestore wrappers
  const updateRecord = updateSnapshot.data();
  const formUpdateData = updateRecord.data;
  const baseRecord = baseSnapshot.data();

  const personRecord = personSnapshot.data();

  // Drop out if any record is missing
  if (!formUpdateData || !baseRecord || !personRecord) return out;

  const { metadata } = personRecord;

  // Safety checks for person record
  if (
    personRecord.stateCode !== "US_TN" ||
    metadata.stateCode !== "US_TN" ||
    metadata.latestClassificationDate === undefined
  )
    return out;

  const safeParsedBaseRecord = isDcaf
    ? usTnInitialClassification2026Schema.safeParse(baseRecord)
    : usTnReclassification2026Schema.safeParse(baseRecord);

  // Drop out if we could not parse the base record
  if (!safeParsedBaseRecord.success) return out;

  const parsedBaseRecord = safeParsedBaseRecord.data;

  // Fill the output with fields from outside the form data
  out.state_code = "US_TN";
  // slice off the leading us_tn_
  out.OFFENDERID = personRecordKey.slice(6);
  out.ClassificationType = isDcaf ? "DCAF" : "RCAF";
  out.AssessmentDate = updateRecord.updated.date
    .toDate()
    .toISOString()
    .split("T")[0];
  out.LastModifiedDate = updateRecord.updated.date.toDate().toISOString();
  out.LastModifiedBy = updateRecord.updated.by;
  out.LastClassificationDate = metadata.latestClassificationDate;
  switch (opportunityType) {
    case "usTnInitialClassification2026Policy":
      out.ClassificationFormType = "Initial";
      break;
    case "usTnAnnualReclassification2026Policy":
      out.ClassificationFormType = "Annual";
      break;
    case "usTnCustodyLevelDowngrade2026Policy":
      out.ClassificationFormType = "Downgrade";
      break;
    case "usTnSpecialCustodyLevelUpgrade2026Policy":
      out.ClassificationFormType = "Upgrade";
      break;
    case "usTnSeriousMisconductUpgrade":
      out.ClassificationFormType = "SeriousMisconduct";
      break;
    case "usTnBiannualOther":
      out.ClassificationFormType = "BiannualOther";
      break;
    case "usTnTrusteeTransfer":
      out.ClassificationFormType = "Transfer";
  }

  // transform the record data into the fields stored in the update record
  const prefilled = isDcaf
    ? // @ts-expect-error We are handling the Dcaf separately from Rcaf via
      // the isDcaf flag, but telling the typesystem that will just be a lot of
      // extra duplicated code
      prefillDcafFormData(parsedBaseRecord.formInformation)
    : // @ts-expect-error ditto
      prefillRcafFormData(parsedBaseRecord.formInformation);

  const combinedRecord = {
    ...parsedBaseRecord.formInformation,
    ...prefilled,
    ...formUpdateData,
  };

  // Loop over the columns that can be derived directly from the update record
  Object.entries(COLUMN_MAPPING).forEach(([field, getter]) => {
    // @ts-expect-error The type of q3Notes does not align, but we don't access that field
    const value = getter(combinedRecord);
    if (value !== undefined) out[field] = value;
  });

  const derivedData = isDcaf
    ? // @ts-expect-error See note above
      deriveDcafFormData(combinedRecord)
    : // @ts-expect-error See note above
      deriveRcafFormData(combinedRecord);

  out.UpdatedFields = Object.keys(formUpdateData);

  // Map over the derived fields and record them if an input field was updated
  Object.entries(
    isDcaf ? DERIVED_DATA_MAPPING_DCAF : DERIVED_DATA_MAPPING_RCAF,
  ).forEach(([outField, { sourceField, relevantFields }]) => {
    const value = derivedData[sourceField];

    if (typeof value === "boolean") {
      out[outField] = value ? "T" : "F";
    } else {
      out[outField] = value;
    }

    // if none of the fields that contribute to the calculation of this field were modified, skip this entry
    // @ts-expect-error We filter by classification type above, but it still fine to find an undefined even if we don't filter a key out
    if (relevantFields.some((field) => formUpdateData[field] !== undefined)) {
      // @ts-expect-error We define it 22 lines above
      out.UpdatedFields.push(outField);
    }
  });

  // If the person scored low, they were assessed for trustee status
  out.TrusteeFlag = out.SourcedCustodyLevel === "LOW" ? "T" : "F";

  return out;
}

async function getFormUpdateDocs(
  db: Firestore,
  opportunityType: OpportunityType,
  collectionName: string,
) {
  const lastUpdatedThreshold = subHours(new Date(), LOOKBACK_HOURS);

  console.info(`Fetching update documents for ${opportunityType}`);

  const updatesRes = await db
    .collectionGroup("clientFormUpdates")
    .where("opportunity", "==", opportunityType)
    .where("updated.date", ">=", lastUpdatedThreshold)
    .get();

  console.info(`Found ${updatesRes.docs.length} updates`);

  const entries = [];

  for (let i = 0; i < updatesRes.docs.length; i++) {
    const updateDoc = updatesRes.docs[i];

    const personFirestoreKey = updateDoc.ref.path.split("/")[1];

    // eslint-disable-next-line no-await-in-loop
    const [baseRecordDoc, personRecordDoc] = await Promise.all([
      db.collection(collectionName).doc(personFirestoreKey).get(),
      db.collection("residents").doc(personFirestoreKey).get(),
    ]);

    const processed = processRecord(
      opportunityType,
      personFirestoreKey,
      // @ts-expect-error we know the data type matches
      updateDoc,
      baseRecordDoc,
      personRecordDoc,
    );
    entries.push(processed);
  }

  return entries;
}

async function getUpdatedRecords() {
  const db = firestore();

  const entries = await getFormUpdateDocs(
    db,
    "usTnTrusteeTransfer",
    "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnSeriousMisconductUpgrade",
      "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnBiannualOther",
      "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnSpecialCustodyLevelUpgrade2026Policy",
      "US_TN-specialCustodyLevelUpgrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnAnnualReclassification2026Policy",
      "US_TN-annualReclassification2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnCustodyLevelDowngrade2026Policy",
      "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      db,
      "usTnInitialClassification2026Policy",
      "US_TN-initialClassification2026PolicyReferrals",
    )),
  );

  return entries;
}

async function runTransfer() {
  const dryRun = false;

  const updatesToUpload = await getUpdatedRecords();

  if (dryRun) {
    console.warn("Note: Dry run");
  }

  console.info(`Found ${updatesToUpload.length} updates to upload.`);

  // Insert every column in CSV_COLUMN order into us_tn_caf_edits
  let query = `INSERT INTO us_tn_caf_edits (${CSV_COLUMN_ORDER.map((c) => `"${c}"`).join(", ")})`;
  // With templated values ($1, $2, $3, ..., $(CSV_COLUMN_ORDER+length))
  // Note that by unsing templated values here, we get two things:
  // 1. We only need to generate the query string once
  // 2. The server will sanitize all the values for SQL injection for us
  query += ` VALUES (${CSV_COLUMN_ORDER.map((_, i) => `$${i + 1}`).join(", ")})`;
  // If there is a PK conflict,
  query += ` ON CONFLICT ("state_code", "OFFENDERID", "ClassificationType", "ClassificationFormType", "AssessmentDate") DO UPDATE SET `;
  // replace all columns with the values from the new (EXCLUDED) entry
  query += CSV_COLUMN_ORDER.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ");

  console.debug("Query to execute:");
  console.debug(query);

  if (dryRun) {
    console.warn("Dry run. Exiting without connecting to postgres.");
    process.exit(0);
  }

  const connector = new Connector();
  const { user, password, connection } = persistenceDbConfigSecrets.value();

  console.info(`Connecting to postgres instance ${connection}`);

  const clientOpts = await connector.getOptions({
    instanceConnectionName: connection,
    ipType: IpAddressTypes.PUBLIC,
  });

  const pool = new Pool({
    stream: clientOpts.stream(),
    user,
    password,
    database: "postgres",
    max: 5,
  });

  const res = [];
  for (const update of updatesToUpload) {
    res.push(
      // eslint-disable-next-line no-await-in-loop
      await pool.query(
        query,
        //
        CSV_COLUMN_ORDER.map((c) => update[c]),
      ),
    );
  }

  console.info("Updates written to postgres. Exiting.");

  await pool.end();
  connector.close();
}

exports.exportUsTnCafData = onSchedule(EXECUTION_OPTIONS, runTransfer);
