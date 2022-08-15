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
  DocumentReference,
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

import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import {
  CompliantReportingReferralRecord,
  OpportunityType,
} from "../WorkflowsStore";
import { EarlyTerminationReferralRecord } from "../WorkflowsStore/Opportunity/EarlyTerminationReferralRecord";
import {
  ClientRecord,
  ClientUpdateRecord,
  CombinedUserRecord,
  FeatureVariantRecord,
  FormFieldData,
  isUserRecord,
  OpportunityEdits,
  OpportunityUpdateRecord,
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

export const authenticate = async (
  auth0Token: string
): Promise<ReturnType<typeof signInWithCustomToken>> => {
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
};

const db = getFirestore(app);
if (useOfflineFirestore) {
  connectFirestoreEmulator(db, "localhost", 8080);
}

const collectionNames = {
  staff: "staff",
  userUpdates: "userUpdates",
  clients: "clients",
  clientUpdates: "clientUpdates",
  clientUpdatesV2: "clientUpdatesV2",
  clientOpportunityUpdates: "clientOpportunityUpdates",
  compliantReportingReferrals: "compliantReportingReferrals",
  earlyTerminationReferrals: "earlyTerminationReferrals",
  featureVariants: "featureVariants",
};

if (isDemoMode()) {
  Object.entries(collectionNames).forEach(([key, value]) => {
    collectionNames[key as keyof typeof collectionNames] = `DEMO_${value}`;
  });
}

const collections = {
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
  clientUpdatesV2: collection(db, collectionNames.clientUpdatesV2),
  compliantReportingReferrals: collection(
    db,
    collectionNames.compliantReportingReferrals
  ) as CollectionReference<CompliantReportingReferralRecord>,
  earlyTerminationReferrals: collection(
    db,
    collectionNames.earlyTerminationReferrals
  ) as CollectionReference<EarlyTerminationReferralRecord>,
  featureVariants: collection(
    db,
    collectionNames.featureVariants
  ) as CollectionReference<FeatureVariantRecord>,
};

export async function getUser(
  email: string
): Promise<CombinedUserRecord | undefined> {
  const queryEmail = email.toLowerCase();
  const [
    infoSnapshot,
    updateSnapshot,
    featureVariantSnapshot,
  ] = await Promise.all([
    getDocs(
      query(collections.staff, where("email", "==", queryEmail), limit(1))
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
  clientId: string
): Promise<ClientRecord | undefined> {
  // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
  const results = await getDocs(
    query(
      collections.clients,
      where("pseudonymizedId", "==", clientId),
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
    (result: DocumentSnapshot) =>
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
    (result: DocumentSnapshot) =>
      handleResults(result.data({ serverTimestamps: "estimate" }))
  );
}

/**
 * This will migrate legacy data to the new subcollection, if there is no document in the
 * new subcollection but legacy data exists. It will not change any data in legacy collections,
 * but the expectation is that they will be ignored once the new collection is populated.
 * TODO(#2108): Remove this function after migration is complete
 */
async function migrateOpportunityUpdate(
  updateDocRef: DocumentReference,
  clientId: string,
  clientRecordId: string,
  opportunityType: OpportunityType
) {
  // if destination document does not already exist, we will look for a legacy document to migrate
  let dataToMigrate: OpportunityEdits | undefined;
  if (!(await getDoc(updateDocRef)).exists()) {
    const {
      docRef: v2UpdatesDocRef,
      oldDocument: v1UpdatesDoc,
    } = await getClientUpdatesV2DocRef(clientId, clientRecordId);

    // legacy format(s): object nested directly in the update doc
    let legacyRecord = v1UpdatesDoc;
    // this doc will only be returned if the v2 doc does not exist
    if (!v1UpdatesDoc) {
      legacyRecord = (await getDoc(v2UpdatesDocRef)).data();
    }

    dataToMigrate = legacyRecord?.[opportunityType];
  }

  if (dataToMigrate) {
    // write old + new data to new destination
    setDoc(updateDocRef, dataToMigrate);
  }
}

/**
 * @param opportunityType needs to match `UpdateType`! This function does not verify that it does
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToOpportunityUpdate<
  UpdateType extends OpportunityUpdateRecord
>(
  clientId: string,
  clientRecordId: string,
  opportunityType: OpportunityType,
  handleResults: (results?: UpdateType) => void
): Unsubscribe {
  const updateDocRef = doc(
    collections.clientUpdatesV2,
    clientRecordId,
    collectionNames.clientOpportunityUpdates,
    opportunityType
  );

  migrateOpportunityUpdate(
    updateDocRef,
    clientId,
    clientRecordId,
    opportunityType
  );

  return onSnapshot(updateDocRef, (result) => {
    const data = result.data({ serverTimestamps: "estimate" });
    handleResults(data && ({ ...data, type: opportunityType } as UpdateType));
  });
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

export function subscribeToCompliantReportingReferral(
  recordId: string,
  handleResults: (results: CompliantReportingReferralRecord | undefined) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.compliantReportingReferrals, recordId),
    (result) => {
      handleResults(result.data());
    }
  );
}

export function subscribeToEarlyTerminationReferral(
  clientId: string,
  handleResults: (results: EarlyTerminationReferralRecord | undefined) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.earlyTerminationReferrals, clientId),
    (result) => {
      handleResults(result.data());
    }
  );
}

// TODO(#2108): Clean up requests to `clientUpdates` after fully migrating to `clientUpdatesV2`
const getClientUpdatesV2DocRef = async function (
  clientId: string,
  recordId: string
): Promise<{
  docRef: DocumentReference;
  oldDocument: ClientUpdateRecord | undefined;
}> {
  let oldDocument;
  const docRef = doc(collections.clientUpdatesV2, recordId);
  const newDocument = await getDoc(docRef);

  if (!newDocument.exists()) {
    // Get old document to merge with new updates
    oldDocument = (
      await getDoc(doc(collections.clientUpdates, clientId))
    ).data();
  }

  return { docRef, oldDocument };
};

async function updateOpportunity(
  opportunityType: OpportunityType,
  recordId: string,
  update: PartialWithFieldValue<OpportunityEdits>
) {
  const opportunityDocRef = doc(
    collections.clientUpdatesV2,
    `${recordId}/${collectionNames.clientOpportunityUpdates}/${opportunityType}`
  );

  return setDoc(opportunityDocRef, { ...update }, { merge: true });
}

export const updateCompliantReportingDraft = async function (
  updatedBy: string,
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

export function updateSelectedOfficerIds(
  userEmail: string,
  selectedOfficerIds: string[]
): Promise<void> {
  return setDoc(
    doc(collections.userUpdates, userEmail),
    {
      selectedOfficerIds,
    },
    { merge: true }
  );
}

/* Early Termination */
// TODO: Combine updateCompliantReportingDraft and this once no longer querying clientUpdates?
export const updateEarlyTerminationDraft = async function (
  updatedBy: string,
  recordId: string,
  data: FormFieldData
): Promise<void> {
  const update = {
    referralForm: {
      updated: { by: updatedBy, date: serverTimestamp() },
      data,
    },
  };
  return updateOpportunity("earlyTermination", recordId, update);
};
