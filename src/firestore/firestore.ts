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
import {
  collection,
  CollectionReference,
  connectFirestoreEmulator,
  deleteField,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  PartialWithFieldValue,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { mapValues, pickBy } from "lodash";
import { when } from "mobx";

import { trackSetOpportunityStatus } from "../analytics";
import { UserAppMetadata } from "../RootStore/types";
import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import { Opportunity, OpportunityType } from "../WorkflowsStore";
import {
  ClientRecord,
  ClientUpdateRecord,
  CombinedUserRecord,
  FeatureVariantRecord,
  FormFieldData,
  isUserRecord,
  OpportunityUpdateWithForm,
  StaffRecord,
  UserUpdateRecord,
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
  clientUpdates: "clientUpdates",
  clientUpdatesV2: "clientUpdatesV2",
  clientOpportunityUpdates: "clientOpportunityUpdates",
  compliantReportingReferrals: "compliantReportingReferrals",
  earnedDischargeReferrals: "US_ID-earnedDischargeReferrals",
  earlyTerminationReferrals: "earlyTerminationReferrals",
  LSUReferrals: "US_ID-LSUReferrals",
  pastFTRDReferrals: "US_ID-pastFTRDReferrals",
  featureVariants: "featureVariants",
};

export type CollectionName = keyof typeof collectionNames;

if (isDemoMode()) {
  Object.entries(collectionNames).forEach(([key, value]) => {
    collectionNames[key as keyof typeof collectionNames] = `DEMO_${value}`;
  });
}

export const collections = {
  staff: collection(
    db,
    collectionNames.staff
  ) as CollectionReference<StaffRecord>,
  userUpdates: collection(
    db,
    collectionNames.userUpdates
  ) as CollectionReference<UserUpdateRecord>,
  clients: collection(
    db,
    collectionNames.clients
  ) as CollectionReference<ClientRecord>,
  clientUpdates: collection(
    db,
    collectionNames.clientUpdates
  ) as CollectionReference<ClientUpdateRecord>,
  clientUpdatesV2: collection(
    db,
    collectionNames.clientUpdatesV2
  ) as CollectionReference,
  compliantReportingReferrals: collection(
    db,
    collectionNames.compliantReportingReferrals
  ),
  earlyTerminationReferrals: collection(
    db,
    collectionNames.earlyTerminationReferrals
  ),
  PastFTRDReferrals: collection(db, collectionNames.pastFTRDReferrals),
  LSUReferrals: collection(db, collectionNames.LSUReferrals),
  featureVariants: collection(
    db,
    collectionNames.featureVariants
  ) as CollectionReference<FeatureVariantRecord>,
};

export async function getUser(
  email: string,
  stateCode: string
): Promise<CombinedUserRecord | undefined> {
  const queryEmail = email.toLowerCase();
  const [
    infoSnapshot,
    updateSnapshot,
    featureVariantSnapshot,
  ] = await Promise.all([
    getDocs(
      query(
        collections.staff,
        where("email", "==", queryEmail),
        where("stateCode", "==", stateCode),
        limit(1)
      )
    ),
    getDoc(doc(collections.userUpdates, queryEmail)),
    getDoc(doc(collections.featureVariants, queryEmail)),
  ]);
  const info = infoSnapshot.docs[0]?.data();
  if (!info || !isUserRecord(info)) return undefined;

  const updates = updateSnapshot.data();
  const featureVariants = featureVariantSnapshot.data();

  return {
    info,
    updates,
    featureVariants,
  };
}

export function subscribeToUserUpdates(
  email: string,
  handleResults: (results?: UserUpdateRecord) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.userUpdates, email.toLowerCase()),
    (result) => {
      handleResults(result.data());
    }
  );
}

export function subscribeToFeatureVariants(
  email: string,
  handleResults: (results?: FeatureVariantRecord) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.featureVariants, email.toLowerCase()),
    (result) => {
      const featureVariants = result.data();
      handleResults(featureVariants);
    }
  );
}

export async function getClient(
  clientId: string,
  stateCode: string
): Promise<ClientRecord | undefined> {
  // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
  const results = await getDocs(
    query(
      collections.clients,
      where("pseudonymizedId", "==", clientId),
      where("stateCode", "==", stateCode),
      limit(1)
    )
  );

  const result = results.docs[0];
  if (result.exists()) return { ...result.data(), recordId: result.id };
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToClientUpdates(
  clientId: string,
  handleResults: (results?: ClientUpdateRecord) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.clientUpdates, clientId),
    (result: DocumentSnapshot<ClientUpdateRecord>) =>
      handleResults(result.data({ serverTimestamps: "estimate" }))
  );
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToClientUpdatesV2(
  recordId: string,
  handleResults: (results?: ClientUpdateRecord) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.clientUpdatesV2, recordId),
    (result: DocumentSnapshot<ClientUpdateRecord>) =>
      handleResults(result.data({ serverTimestamps: "estimate" }))
  );
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToOfficers(
  stateCode: string,
  district: string | undefined,
  handleResults: (results: StaffRecord[]) => void
): Unsubscribe {
  const constraints = [
    where("stateCode", "==", stateCode),
    where("hasCaseload", "==", true),
  ];

  if (district) {
    constraints.push(where("district", "==", district));
  }
  return onSnapshot(query(collections.staff, ...constraints), (results) => {
    const docs: StaffRecord[] = [];
    results.forEach((result) => {
      docs.push(result.data());
    });
    handleResults(docs);
  });
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToCaseloads(
  stateCode: string,
  officerIds: string[],
  handleResults: (results: ClientRecord[]) => void
): Unsubscribe {
  // constructing the query in a new closure ensures that
  // we dereference the collection when the function is CALLED,
  // rather than when the function is DEFINED. This is important
  // because the collections object may have been patched during that interval.
  function getCaseloadQuery() {
    return query(
      collections.clients,
      where("stateCode", "==", stateCode),
      where("officerId", "in", officerIds)
    );
  }

  return onSnapshot(getCaseloadQuery(), (results) => {
    const docs: ClientRecord[] = [];
    results.forEach((result) => {
      docs.push({ ...result.data(), recordId: result.id });
    });
    handleResults(docs);
  });
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToEligibleCount(
  opportunityType: OpportunityType,
  stateCode: string,
  officerIds: string[],
  handleResults: (results: number) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collections.clients,
      where("stateCode", "==", stateCode),
      where(`${opportunityType}Eligible`, "!=", null),
      where("officerId", "in", officerIds)
    ),
    (results) => {
      handleResults(results.size);
    }
  );
}

async function updateOpportunity(
  opportunityType: OpportunityType,
  recordId: string,
  update: PartialWithFieldValue<OpportunityUpdateWithForm<Record<string, any>>>
) {
  const opportunityDocRef = doc(
    collections.clientUpdatesV2,
    `${recordId}/${collectionNames.clientOpportunityUpdates}/${opportunityType}`
  );

  return setDoc(opportunityDocRef, { ...update }, { merge: true });
}

export const updateCompliantReportingDraft = async function (
  updatedBy: string,
  stateCode: string,
  recordId: string,
  data: FormFieldData
): Promise<void> {
  return updateOpportunity("compliantReporting", recordId, {
    referralForm: {
      updated: { by: updatedBy, date: serverTimestamp() },
      data,
    },
  });
};

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
    doc(collections.userUpdates, userEmail),
    {
      stateCode,
      selectedOfficerIds,
    },
    { merge: true }
  );
}

export const updateOpportunityDraftData = async function (
  opportunity: Opportunity,
  name: string,
  value: FieldValue | string | number | boolean
): Promise<void> {
  const { client } = opportunity;
  const update = {
    referralForm: {
      updated: {
        by: client.currentUserEmail || "user",
        date: serverTimestamp(),
      },
      data: { [name]: value },
    },
  };

  await updateOpportunity(opportunity.type, client.recordId, update);

  await when(() => opportunity.isHydrated);

  if (opportunity.reviewStatus === "PENDING") {
    trackSetOpportunityStatus({
      clientId: client.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType: opportunity.type,
    });
  }
};
