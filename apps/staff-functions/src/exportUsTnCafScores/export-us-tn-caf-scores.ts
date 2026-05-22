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
import { isValid, startOfDay, subHours } from "date-fns";
import { firestore } from "firebase-admin";
import { defineJsonSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Pool } from "pg";

import {
  deriveDcafFormData,
  deriveRcafFormData,
  deriveRcafFormDataV2,
  OpportunityType,
  prefillDcafFormData,
  prefillRcafFormData,
  prefillRcafFormDataV2,
  RawResidentRecord,
  TRUSTEE_FORM_QUESTION_ORDER,
  usTnInitialClassification2026Schema,
  UsTnReclassification2026DraftData,
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "~datatypes";

import {
  CSV_COLUMN_ORDER,
  DERIVED_DATA_MAPPING_DCAF,
  DERIVED_DATA_MAPPING_RCAF,
  FormUpdateData,
  OPP_TYPE_TO_COLLECTION,
  OpportunityUpdateData,
} from "./consts";

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

const getTrusteeQuestionValue = (
  data: FormUpdateData["data"],
  index: number,
) => {
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

function processRecord(
  opportunityType: OpportunityType,
  personRecordKey: string,
  updateRecord: FormUpdateData,
  baseRecord: UsTnReclassification2026ReferralRecord["output"],
  personRecord: RawResidentRecord,
  assessmentDate: Date,
  lastModifiedBy: string,
  lastModifiedDate: Date,
) {
  // Set up an output record
  const out: Record<
    string,
    string | string[] | number | boolean | undefined | null
  > = {};

  // Set flag to use dcaf vs rcaf helpers
  const isDcaf = opportunityType === "usTnInitialClassification2026Policy";
  const isRcafV2 = opportunityType.includes("V2");

  const formUpdateData = updateRecord.data ?? {};

  // Drop out if the base opportunity record or person record is missing
  if (!baseRecord || !personRecord) return undefined;

  const { metadata } = personRecord;

  // Safety checks for person record
  if (
    personRecord.stateCode !== "US_TN" ||
    metadata.stateCode !== "US_TN" ||
    metadata.latestClassificationDate === undefined
  )
    return undefined;

  const safeParsedBaseRecord = isDcaf
    ? usTnInitialClassification2026Schema.safeParse(baseRecord)
    : usTnReclassification2026Schema.safeParse(baseRecord);

  // Drop out if we could not parse the base record
  if (!safeParsedBaseRecord.success) return undefined;

  const parsedBaseRecord = safeParsedBaseRecord.data;

  // Fill the output with fields from outside the form data
  out.state_code = "US_TN";
  // slice off the leading us_tn_
  out.OFFENDERID = personRecordKey.slice(6);
  // eslint-disable-next-line no-nested-ternary
  out.ClassificationType = isDcaf ? "DCAF" : isRcafV2 ? "RCAF_V2" : "RCAF";
  out.AssessmentDate = assessmentDate.toISOString().split("T")[0];
  out.LastModifiedDate = lastModifiedDate.toISOString();
  out.LastModifiedBy = lastModifiedBy;
  out.LastClassificationDate = metadata.latestClassificationDate;
  switch (opportunityType) {
    case "usTnInitialClassification2026Policy":
      out.ClassificationFormType = "Initial";
      break;
    case "usTnAnnualReclassification2026Policy":
    case "usTnAnnualReclassification2026PolicyV2":
      out.ClassificationFormType = "Annual";
      break;
    case "usTnCustodyLevelDowngrade2026Policy":
    case "usTnCustodyLevelDowngrade2026PolicyV2":
      out.ClassificationFormType = "Downgrade";
      break;
    case "usTnSpecialCustodyLevelUpgrade2026Policy":
    case "usTnSpecialCustodyLevelUpgrade2026PolicyV2":
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
  // eslint-disable-next-line no-nested-ternary
  const prefilled = isDcaf
    ? // @ts-expect-error We are handling the Dcaf separately from Rcaf via
      // the isDcaf flag, but telling the typesystem that will just be a lot of
      // extra duplicated code
      prefillDcafFormData(parsedBaseRecord.formInformation)
    : isRcafV2
      ? // @ts-expect-error ditto
        prefillRcafFormDataV2(parsedBaseRecord.formInformation)
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

  // eslint-disable-next-line no-nested-ternary
  const derivedData = isDcaf
    ? // @ts-expect-error See note above
      deriveDcafFormData(combinedRecord)
    : isRcafV2
      ? // @ts-expect-error See note above
        deriveRcafFormDataV2(combinedRecord)
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
) {
  const lastUpdatedThreshold = subHours(new Date(), LOOKBACK_HOURS);
  // @ts-expect-error We know we are limited to just the defined opportuities here
  const collectionName = OPP_TYPE_TO_COLLECTION[opportunityType];

  if (collectionName === undefined) {
    console.error(
      `No entry in OPP_TYPE_TO_COLLECTION for ${opportunityType}. Skipping.`,
    );
    return [];
  }

  console.info(`Fetching update documents for ${opportunityType}`);

  // Query for updated forms
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
    // Pull data from the firestore wrappers
    const updateRecord = updateDoc.data() as FormUpdateData;
    const baseRecord = baseRecordDoc.data();

    const personRecord = personRecordDoc.data();

    const processed = processRecord(
      opportunityType,
      personFirestoreKey,
      updateRecord,
      // @ts-expect-error we know the data type matches
      baseRecord,
      personRecord,
      updateRecord.updated.date.toDate(),
      updateRecord.updated.by,
      updateRecord.updated.date.toDate(),
    );

    if (processed) entries.push(processed);
  }

  return entries;
}

async function getDownloadOnlyDocs(db: Firestore) {
  const lastUpdatedThreshold = subHours(new Date(), LOOKBACK_HOURS);

  // Query for downloaded forms
  const opportunityUpdatesRes = await db
    .collectionGroup("clientOpportunityUpdates")
    .where("stateCode", "==", "US_TN")
    .where("submitted.date", ">=", lastUpdatedThreshold)
    .get();

  console.info(
    `${opportunityUpdatesRes.docs.length} opportunity updates found in TN`,
  );

  const entries = [];

  for (let i = 0; i < opportunityUpdatesRes.docs.length; i++) {
    const opportunityUpdateDoc = opportunityUpdatesRes.docs[i];

    const personFirestoreKey = opportunityUpdateDoc.ref.path.split("/")[1];
    const opportunityType = opportunityUpdateDoc.ref.path
      .split("/")
      // take the last entry in the path which will be of the form
      // usTnSomeOpportunityType_YYYY-MM-DD
      .slice(-1)[0]
      // slice off the date and keep the first part
      .split("_")[0];

    if (!(opportunityType in OPP_TYPE_TO_COLLECTION)) {
      continue;
    }

    // @ts-expect-error We check on the line above to ensure it is a valid key
    const collectionName = OPP_TYPE_TO_COLLECTION[opportunityType];

    // eslint-disable-next-line no-await-in-loop
    const [baseRecordDoc, personRecordDoc, formUpdateDoc] = await Promise.all([
      db.collection(collectionName).doc(personFirestoreKey).get(),
      db.collection("residents").doc(personFirestoreKey).get(),
      db
        .collection("clientUpdatesV2")
        .doc(personFirestoreKey)
        .collection("clientFormUpdates")
        .doc(`-${opportunityType}`)
        .get(),
    ]);

    // Pull data from the firestore wrappers
    const opportunityUpdateRecord =
      opportunityUpdateDoc.data() as OpportunityUpdateData;
    const formUpdateRecord = formUpdateDoc.data() as FormUpdateData;

    const lastFormUpdate = formUpdateRecord?.updated.date.toDate();
    const opportunityLastSubmitted =
      opportunityUpdateRecord?.submitted.date.toDate();

    if (formUpdateDoc.exists) {
      // If the form has been updated since the start of the last day the form was downloaded,
      // skip this record since it will be picked up in getFormUpdateDocs()
      if (lastFormUpdate >= startOfDay(opportunityLastSubmitted)) {
        continue;
      }
    }

    const baseRecord = baseRecordDoc.data();
    const personRecord = personRecordDoc.data();

    const processed = processRecord(
      // @ts-expect-error we ensure this string is a valid type when we check for its existence in OPP_TYPE_TO_COLLECTION
      opportunityType,
      personFirestoreKey,
      formUpdateRecord ?? {},
      baseRecord,
      personRecord,
      lastFormUpdate ?? opportunityLastSubmitted,
      formUpdateRecord?.updated.by ?? opportunityUpdateRecord?.submitted.by,
      lastFormUpdate ?? opportunityLastSubmitted,
    );

    if (processed) entries.push(processed);
  }

  console.info(`Found ${entries.length} download-only entries to save.`);

  return entries;
}

async function getUpdatedRecords() {
  const db = firestore();

  // Find instances where the form was downloaded without being modified in the last day
  const entries = await getDownloadOnlyDocs(db);

  // Find updates to forms associated with these opportunities
  for (const opportunityType of Object.keys(OPP_TYPE_TO_COLLECTION)) {
    // We are purposefully awaiting in a loop. There are only a few collections
    // to check and this prevents us from opening a large number of connections
    // all at once.

    entries.push(
      // eslint-disable-next-line no-await-in-loop
      ...(await getFormUpdateDocs(db, opportunityType as OpportunityType)),
    );
  }

  return entries;
}

async function runTransfer() {
  const dryRun = false;

  const updatesToUpload = await getUpdatedRecords();

  if (dryRun) {
    console.warn("Note: Dry run");
  }

  console.info(`Found ${updatesToUpload.length} updates to upload.`);

  if (updatesToUpload.length === 0) {
    console.info(
      `No updates found to save. Exiting without connecting to postgres`,
    );
    return;
  }

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
    console.info("Dry run. Exiting without connecting to postgres.");
    return;
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
