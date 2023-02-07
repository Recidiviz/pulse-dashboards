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
import { FieldValue } from "@google-cloud/firestore";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import {
  collection,
  connectFirestoreEmulator,
  deleteField,
  doc,
  getDocs,
  getFirestore,
  limit,
  PartialWithFieldValue,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { mapValues, pickBy } from "lodash";
import { when } from "mobx";

import {
  trackReferralFormFirstEdited,
  trackSetOpportunityStatus,
} from "../analytics";
import { UserAppMetadata } from "../RootStore/types";
import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import { OpportunityType, UsTnExpirationOpportunity } from "../WorkflowsStore";
import { FormBase } from "../WorkflowsStore/Opportunity/Forms/FormBase";
import {
  ClientRecord,
  OpportunityUpdateWithForm,
  ResidentRecord,
  UsTnExpirationOpportunityUpdate,
} from "./types";

function getFirestoreProjectId() {
  const projectId = process.env.REACT_APP_FIREBASE_BACKEND_PROJECT;

  // default to offline mode when missing configuration (e.g. in unit tests)
  if (isOfflineMode() || !projectId) {
    // demo-* is the Firebase magic word for a dummy project
    return "demo-dev";
  }

  return projectId;
}

const projectId = getFirestoreProjectId();
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const app = initializeApp({
  projectId,
  apiKey,
});

// demo- is a Firebase-reserved prefix that will only work with local emulators
const useOfflineFirestore = projectId.startsWith("demo-");

// Authenticate with Firebase for users with access to workflows
export const authenticate = async (
  auth0Token: string,
  appMetadata?: UserAppMetadata
): Promise<ReturnType<typeof signInWithCustomToken> | undefined> => {
  const shouldGenerateToken =
    appMetadata?.state_code === "recidiviz" ||
    isOfflineMode() ||
    appMetadata?.routes?.workflows;

  if (shouldGenerateToken) {
    const tokenExchangeResponse = await fetch(
      `${process.env.REACT_APP_API_URL}/token`,
      {
        headers: {
          Authorization: `Bearer ${auth0Token}`,
        },
      }
    );

    const { firebaseToken } = await tokenExchangeResponse.json();
    const auth = getAuth(app);
    if (useOfflineFirestore) {
      connectAuthEmulator(auth, "http://localhost:9099");
    }
    return signInWithCustomToken(auth, firebaseToken);
  }
};

export const db = getFirestore(app);
if (useOfflineFirestore) {
  connectFirestoreEmulator(db, "localhost", 8080);
}

export const collectionNames = {
  staff: "staff",
  userUpdates: "userUpdates",
  clients: "clients",
  residents: "residents",
  clientUpdates: "clientUpdates",
  clientUpdatesV2: "clientUpdatesV2",
  clientOpportunityUpdates: "clientOpportunityUpdates",
  compliantReportingReferrals: "compliantReportingReferrals",
  earnedDischargeReferrals: "US_ID-earnedDischargeReferrals",
  earlyTerminationReferrals: "earlyTerminationReferrals",
  LSUReferrals: "US_ID-LSUReferrals",
  pastFTRDReferrals: "US_ID-pastFTRDReferrals",
  featureVariants: "featureVariants",
  supervisionLevelDowngradeReferrals: "US_TN-supervisionLevelDowngrade",
  usMeSCCPReferrals: "US_ME-SCCPReferrals",
  usIdSupervisionLevelDowngradeReferrals: "US_ID-supervisionLevelDowngrade",
  usTnExpirationReferrals: "US_TN-expirationReferrals",
};

export type CollectionName = keyof typeof collectionNames;

if (isDemoMode()) {
  Object.entries(collectionNames).forEach(([key, value]) => {
    collectionNames[key as keyof typeof collectionNames] = `DEMO_${value}`;
  });
}

export async function getClient(
  clientId: string,
  stateCode: string
): Promise<ClientRecord | undefined> {
  // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
  const results = await getDocs(
    query(
      collection(db, collectionNames.clients),
      where("pseudonymizedId", "==", clientId),
      where("stateCode", "==", stateCode),
      limit(1)
    )
  );

  const result = results.docs[0];
  if (result.exists())
    return {
      ...(result.data() as Omit<ClientRecord, "recordId" | "personType">),
      recordId: result.id,
      personType: "CLIENT",
    };
}

export async function getResident(
  residentId: string,
  stateCode: string
): Promise<ResidentRecord | undefined> {
  // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
  const results = await getDocs(
    query(
      collection(db, collectionNames.residents),
      where("pseudonymizedId", "==", residentId),
      where("stateCode", "==", stateCode),
      limit(1)
    )
  );

  const result = results.docs[0];
  if (result.exists())
    return {
      ...(result.data() as Omit<ResidentRecord, "recordId" | "personType">),
      recordId: result.id,
      personType: "RESIDENT",
    };
}

async function updateOpportunity<
  T extends OpportunityUpdateWithForm<Record<string, any>>
>(
  opportunityType: OpportunityType,
  recordId: string,
  update: PartialWithFieldValue<T>
) {
  const opportunityDocRef = doc(
    db,
    collectionNames.clientUpdatesV2,
    `${recordId}/${collectionNames.clientOpportunityUpdates}/${opportunityType}`
  );

  return setDoc(opportunityDocRef, { ...update }, { merge: true });
}

export async function updateOpportunityDenial(
  userEmail: string,
  recordId: string,
  fieldUpdates: {
    reasons?: string[];
    otherReason?: string;
  },
  opportunityType: OpportunityType,
  deleteFields?: {
    otherReason: boolean;
  }
): Promise<void> {
  // Firestore will reject any undefined values so filter them out
  const filteredUpdates = pickBy(fieldUpdates);

  const fieldsToDelete = mapValues(pickBy(deleteFields), () => deleteField());

  const changes = {
    denial: {
      ...filteredUpdates,
      ...fieldsToDelete,
      updated: {
        by: userEmail,
        date: serverTimestamp(),
      },
    },
  };

  return updateOpportunity(opportunityType, recordId, changes);
}

export async function updateOpportunityCompleted(
  userEmail: string,
  recordId: string,
  opportunityType: OpportunityType,
  clearCompletion = false
): Promise<void> {
  return updateOpportunity(opportunityType, recordId, {
    completed: clearCompletion
      ? deleteField()
      : {
          update: {
            by: userEmail,
            date: serverTimestamp(),
          },
        },
  });
}

export async function updateOpportunityFirstViewed(
  userEmail: string,
  recordId: string,
  opportunityType: OpportunityType
): Promise<void> {
  return updateOpportunity(opportunityType, recordId, {
    firstViewed: { by: userEmail, date: serverTimestamp() },
  });
}

export function updateSelectedOfficerIds(
  userEmail: string,
  stateCode: string,
  selectedOfficerIds: string[]
): Promise<void> {
  return setDoc(
    doc(db, collectionNames.userUpdates, userEmail),
    {
      stateCode,
      selectedOfficerIds,
    },
    { merge: true }
  );
}

export const updateFormDraftData = async function (
  form: FormBase<any>,
  name: string,
  value: FieldValue | string | number | boolean
): Promise<void> {
  const { opportunity, formLastUpdated, type } = form;
  const { person } = opportunity;

  await when(() => opportunity.isHydrated);

  const update = {
    referralForm: {
      updated: {
        by: opportunity.currentUserEmail || "user",
        date: serverTimestamp(),
      },
      data: { [name]: value },
    },
  };
  const isFirstEdit = !formLastUpdated;

  await updateOpportunity(type, person.recordId, update);

  if (isFirstEdit) {
    trackReferralFormFirstEdited({
      justiceInvolvedPersonId: person.pseudonymizedId,
      opportunityType: type,
    });
  }

  if (opportunity.reviewStatus === "PENDING") {
    trackSetOpportunityStatus({
      justiceInvolvedPersonId: person.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType: type,
    });
  }
};

export const updateUsTnExpirationContactNoteSubmitted = async function (
  opportunity: UsTnExpirationOpportunity,
  recordId: string,
  contactNote: Record<number, string[]>,
  submittedTimestamp: Timestamp
) {
  // Ignore recidiviz and non-state users in prod
  if (
    process.env.REACT_APP_DEPLOY_ENV === "production" &&
    opportunity.rootStore.userStore.stateCode !== opportunity.person.stateCode
  )
    return;

  const contactNoteUpdate: UsTnExpirationOpportunityUpdate = {
    contactNote: {
      status: "PENDING",
      submitted: {
        by: opportunity.currentUserEmail || "user",
        date: submittedTimestamp,
      },
      note: contactNote,
      noteStatus: {},
    },
  };

  return updateOpportunity(opportunity.type, recordId, contactNoteUpdate);
};
