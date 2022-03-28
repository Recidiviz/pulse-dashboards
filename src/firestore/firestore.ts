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

import { CompliantReportingReferralRecord } from "../PracticesStore/CompliantReportingReferralRecord";
import {
  ClientRecord,
  ClientUpdateRecord,
  CombinedUserRecord,
  OpportunityType,
  StaffRecord,
  UserUpdateRecord,
} from "./types";

const projectId = process.env.REACT_APP_FIREBASE_BACKEND_PROJECT || "demo-dev";
const isDemoProject = projectId.startsWith("demo-");
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

const app = initializeApp({
  projectId,
  apiKey,
});

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
  if (isDemoProject) {
    connectAuthEmulator(auth, "http://localhost:9099");
  }
  return signInWithCustomToken(auth, firebaseToken);
};

const db = getFirestore(app);
if (isDemoProject) {
  connectFirestoreEmulator(db, "localhost", 8080);
}

const collections = {
  staff: collection(db, "staff") as CollectionReference<StaffRecord>,
  userUpdates: collection(
    db,
    "userUpdates"
  ) as CollectionReference<UserUpdateRecord>,
  clients: collection(db, "clients") as CollectionReference<ClientRecord>,
  clientUpdates: collection(
    db,
    "clientUpdates"
  ) as CollectionReference<ClientUpdateRecord>,
  compliantReportingReferrals: collection(
    db,
    "compliantReportingReferrals"
  ) as CollectionReference<CompliantReportingReferralRecord>,
};

export async function getUser(
  email: string
): Promise<CombinedUserRecord | undefined> {
  const [infoSnapshot, updateSnapshot] = await Promise.all([
    getDocs(query(collections.staff, where("email", "==", email), limit(1))),
    getDocs(
      query(collections.userUpdates, where("email", "==", email), limit(1))
    ),
  ]);
  const info = infoSnapshot.docs[0]?.data();
  if (!info) return undefined;

  const updates = updateSnapshot.docs[0]?.data();

  return {
    info,
    updates,
  };
}

export async function getClient(
  clientId: string
): Promise<ClientRecord | undefined> {
  const result = await getDoc(doc(collections.clients, clientId));
  return result.data();
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToClientUpdates(
  clientId: string,
  handleResults: (results?: ClientUpdateRecord) => void
): Unsubscribe {
  return onSnapshot(doc(collections.clientUpdates, clientId), (result) => {
    handleResults(result.data({ serverTimestamps: "estimate" }));
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
  return onSnapshot(
    query(
      collections.clients,
      where("stateCode", "==", stateCode),
      where("officerId", "in", officerIds)
    ),
    (results) => {
      const docs: ClientRecord[] = [];
      results.forEach((result) => {
        docs.push(result.data());
      });
      handleResults(docs);
    }
  );
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
  clientId: string,
  handleResults: (results: CompliantReportingReferralRecord | undefined) => void
): Unsubscribe {
  return onSnapshot(
    doc(collections.compliantReportingReferrals, clientId),
    (result) => {
      handleResults(result.data());
    }
  );
}

export const updateCompliantReportingDraft = function (
  updatedBy: string,
  clientId: string,
  data: Record<string, boolean | string | string[]>
): Promise<void> {
  return setDoc(
    doc(collections.clientUpdates, clientId),
    {
      compliantReporting: {
        referralForm: {
          updated: { by: updatedBy, date: serverTimestamp() },
          data,
        },
      },
    },
    { merge: true }
  );
};

export function updateCompliantReportingDenial(
  userEmail: string,
  clientId: string,
  fieldUpdates: {
    reasons?: string[];
    otherReason?: string;
  },
  deleteFields?: {
    otherReason: boolean;
  }
): Promise<void> {
  // Firestore will reject any undefined values so filter them out
  const filteredUpdates = pickBy(fieldUpdates);

  const fieldsToDelete = mapValues(pickBy(deleteFields), () => deleteField());

  const changes: PartialWithFieldValue<ClientUpdateRecord> = {
    compliantReporting: {
      denial: {
        ...filteredUpdates,
        ...fieldsToDelete,
        updated: {
          by: userEmail,
          date: serverTimestamp(),
        },
      },
    },
  };

  return setDoc(doc(collections.clientUpdates, clientId), changes, {
    merge: true,
  });
}

export function updateCompliantReportingCompleted(
  userEmail: string,
  clientId: string,
  clearCompletion = false
): Promise<void> {
  return setDoc(
    doc(collections.clientUpdates, clientId),
    {
      compliantReporting: {
        completed: clearCompletion
          ? deleteField()
          : {
              update: {
                by: userEmail,
                date: serverTimestamp(),
              },
            },
      },
    },
    { merge: true }
  );
}
