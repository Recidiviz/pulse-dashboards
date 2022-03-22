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
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  Unsubscribe,
  where,
} from "firebase/firestore";

import { TenantId } from "../RootStore/types";
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
};

export async function getUser(
  email: string,
  stateCode: TenantId
): Promise<CombinedUserRecord | undefined> {
  const [infoSnapshot, updateSnapshot] = await Promise.all([
    getDocs(
      query(
        collections.staff,
        where("stateCode", "==", stateCode),
        where("email", "==", email),
        limit(1)
      )
    ),
    getDocs(
      query(
        collections.userUpdates,
        where("stateCode", "==", stateCode),
        where("email", "==", email),
        limit(1)
      )
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
  stateCode: string,
  clientId: string
): Promise<ClientRecord | undefined> {
  const result = await getDocs(
    query(
      collections.clients,
      where("stateCode", "==", stateCode),
      where("personExternalId", "==", clientId),
      limit(1)
    )
  );
  return result.docs[0]?.data();
}

/**
 * @param handleResults will be called whenever data changes
 * @returns a callable unsubscribe handle
 */
export function subscribeToClientUpdates(
  stateCode: string,
  clientId: string,
  handleResults: (results: ClientUpdateRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collections.clientUpdates,
      where("stateCode", "==", stateCode),
      where("clientId", "==", clientId)
    ),
    (results) => {
      const docs: ClientUpdateRecord[] = [];
      results.forEach((result) => docs.push(result.data()));
      handleResults(docs);
    }
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
