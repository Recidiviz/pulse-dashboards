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

/* eslint-disable no-console */

import { Firestore } from "@google-cloud/firestore";
import { firestore } from "firebase-admin";

import {
  deriveDcafFormData,
  deriveRcafFormData,
  OpportunityType,
  prefillDcafFormData,
  prefillRcafFormData,
  TRUSTEE_FORM_QUESTION_ORDER,
  usTnInitialClassification2026Schema,
  UsTnReclassification2026DraftData,
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "~datatypes";

import { FormUpdate } from "../src/FirestoreStore";
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;
import { csvFormat } from "d3-dsv";

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

type DocData = FormUpdate<UsTnReclassification2026DraftData>;

const getTrusteeQuestionValue = (data: DocData["data"], index: number) => {
  switch (data?.[TRUSTEE_FORM_QUESTION_ORDER[index]]) {
    case "true":
      return "T";
    case "false":
      return "F";
  }
  return undefined;
};

// This record defines a map from raw fields in the update record to output fields
// with minimal transformation. Everything here is derivable just from the update
// record without needing to check the base record
const COLUMN_MAPPING: Record<
  string,
  (
    data: Partial<UsTnReclassification2026DraftData>,
  ) => string | number | undefined
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
  DateOfFinalApprovalAndEntry: (doc) => doc["finalApprovalDate"],

  TrusteeChecklistComplete: (doc) =>
    doc["trusteeNoFelonyDetainers"] !== undefined &&
    doc["trusteeNoPendingFelonyCharges"] !== undefined &&
    doc["trusteeNoPendingImmigrationActions"] !== undefined &&
    doc["trusteeWardenHasApproved"] !== undefined
      ? "Y"
      : "N",
};

// We can conbine the RCAF and DCAF fields into one list since we are
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
];

// This record maps output fields to their source field in the derived data blob
// as well as which fields affect that field. This allows us to determine
// when a field was changed by the update record and record the output
type DerivedDataMapping = Record<
  string,
  {
    sourceField: keyof ReturnType<typeof deriveRcafFormData>;
    relevantFields: (keyof UsTnReclassification2026DraftData)[];
  }
>;

const DERIVED_DATA_MAPPING_DCAF: DerivedDataMapping = {
  Question1: { sourceField: "q1Score", relevantFields: ["q1Selection"] },
  Question2: { sourceField: "q2Score", relevantFields: ["q2Selection"] },
  Question3: { sourceField: "q3Score", relevantFields: ["q3Selection"] },
  Question4: { sourceField: "q4Score", relevantFields: ["q4Selection"] },
  Question5: { sourceField: "q5Score", relevantFields: ["q5Selection"] },
  Question6: { sourceField: "q6Score", relevantFields: ["q6Selection"] },
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
  Question7: { sourceField: "q7Score", relevantFields: ["q7Selection"] },
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
];

function processRecord(
  opportunityType: OpportunityType,
  personRecordKey: string,
  updateSnapshot: QueryDocumentSnapshot<DocData>,
  baseSnapshot: QueryDocumentSnapshot<
    UsTnReclassification2026ReferralRecord["output"]
  >,
  personSnapshot: QueryDocumentSnapshot,
) {
  // Set up an output record
  const out: Record<string, string | number | undefined> = {};

  // Set flag to use dcaf vs rcaf helpers
  const isDcaf = opportunityType === "usTnInitialClassification2026Policy";

  // Pull data from the firestore wrappers
  const updateRecord = updateSnapshot.data();
  const formUpdateData = updateRecord.data;
  const baseRecord = baseSnapshot.data();

  const personRecord = personSnapshot.data();

  // Drop out if any record is missing
  if (!formUpdateData || !baseRecord || !personRecord) return out;

  // Safety checks for person record
  if (
    personRecord.stateCode !== "US_TN" ||
    personRecord.metadata.latestClassificationDate === undefined
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
  out.ClassificationType = "RCAF";
  out.AssessmentDate = updateRecord.updated.date
    .toDate()
    .toISOString()
    .split("T")[0];
  out.LastModifiedBy = updateRecord.updated.by;
  out.LastClassificationDate = personRecord.metadata.latestClassificationDate;
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
    case "usTnSeriousMisconductUpgrade":
      out.ClassificationFormType = "Upgrade";
      break;
    case "usTnTrusteeTransfer":
      out.ClassificationFormType = "Transfer";
  }

  // Loop over the columns that can be derived directly from the update record
  Object.entries(COLUMN_MAPPING).forEach(([field, getter]) => {
    const value = getter(formUpdateData);
    if (value !== undefined) out[field] = value;
  });

  // transform the record data into the fields stored in the update record
  const prefilled = isDcaf
    ? // @ts-expect-error We are handling the Dcaf separately from Rcaf via
      // the isDcaf flag, but telling the typesystem that will just be a lot of
      // extra duplicated code
      prefillDcafFormData(parsedBaseRecord.formInformation)
    : // @ts-expect-error ditto
      prefillRcafFormData(parsedBaseRecord.formInformation);

  const derivedData = isDcaf
    ? // @ts-expect-error See note above
      deriveDcafFormData({
        ...prefilled,
        ...formUpdateData,
      })
    : // @ts-expect-error See note above
      deriveRcafFormData({
        ...prefilled,
        ...formUpdateData,
      });

  // Map over the derived fields and record them if an input field was updated
  Object.entries(
    isDcaf ? DERIVED_DATA_MAPPING_DCAF : DERIVED_DATA_MAPPING_RCAF,
  ).forEach(([outField, { sourceField, relevantFields }]) => {
    // if none of the fields that contribute to the calculation of this field were modified, skip this entry
    if (relevantFields.every((field) => formUpdateData[field] === undefined)) {
      return;
    }

    // The RCAF update has one additional question compared to the DCAF one
    // This check makes sure we don't look for it in the DCAF update
    if (!(sourceField in derivedData)) return;

    // @ts-expect-error We drop out above for the DCAF form
    const value = derivedData[sourceField];

    if (typeof value === "boolean") {
      out[outField] = value ? "T" : "F";
    } else {
      out[outField] = value;
    }
  });

  // If the person scored low, they were assessed for trustee status
  out.TrusteeFlag = out.SourcedCustodyLevel === "LOW" ? "T" : "F";

  return out;
}

const db = getDb();

async function getFormUpdateDocs(
  opportunityType: OpportunityType,
  collectionName: string,
) {
  const updatesRes = await db
    .collectionGroup("clientFormUpdates")
    .where("opportunity", "==", opportunityType)
    .where("updated.date", ">=", new Date("2026-03-01"))
    .get();

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

async function createUpdatesCsv() {
  const entries = await getFormUpdateDocs(
    "usTnTrusteeTransfer",
    "US_TN-custodyLevelDowngrade2026PolicyReferrals",
  );
  entries.push(
    ...(await getFormUpdateDocs(
      "usTnSeriousMisconductUpgrade",
      "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      "usTnSpecialCustodyLevelUpgrade2026Policy",
      "US_TN-specialCustodyLevelUpgrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      "usTnAnnualReclassification2026Policy",
      "US_TN-annualReclassification2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      "usTnCustodyLevelDowngrade2026Policy",
      "US_TN-custodyLevelDowngrade2026PolicyReferrals",
    )),
  );
  entries.push(
    ...(await getFormUpdateDocs(
      "usTnInitialClassification2026Policy",
      "US_TN-initialClassification2026PolicyReferrals",
    )),
  );

  const formattedCsv = csvFormat(entries, CSV_COLUMN_ORDER);
  console.log(formattedCsv);
}

createUpdatesCsv();
