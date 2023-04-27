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
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDocs,
  getFirestore,
  limit,
  PartialWithFieldValue,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { mapValues, pickBy } from "lodash";
import { makeAutoObservable, when } from "mobx";

import {
  fetchFirebaseToken,
  fetchImpersonatedFirebaseToken,
} from "../api/fetchFirebaseToken";
import type RootStore from "../RootStore";
import { UserAppMetadata } from "../RootStore/types";
import UserStore from "../RootStore/UserStore";
import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import { OpportunityType, UsTnExpirationOpportunity } from "../WorkflowsStore";
import { FormBase } from "../WorkflowsStore/Opportunity/Forms/FormBase";
import {
  ClientRecord,
  collectionNames,
  ContactMethodType,
  ExternalSystemRequestStatus,
  OpportunityUpdateWithForm,
  PersonUpdateType,
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

const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

if (isDemoMode()) {
  Object.entries(collectionNames).forEach(([key, value]) => {
    collectionNames[key as keyof typeof collectionNames] = `DEMO_${value}`;
  });
}

export default class FirestoreStore {
  rootStore;

  app: FirebaseApp;

  projectId: string = getFirestoreProjectId();

  db: Firestore;

  constructor({ rootStore }: { rootStore: typeof RootStore }) {
    makeAutoObservable(this, { useOfflineFirestore: false });

    this.rootStore = rootStore;

    this.app = initializeApp({ projectId: this.projectId, apiKey });

    this.db = getFirestore(this.app);

    if (this.useOfflineFirestore) {
      connectFirestoreEmulator(this.db, "localhost", 8080);
    }
  }

  get useOfflineFirestore() {
    // demo- is a Firebase-reserved prefix that will only work with local emulators
    return this.projectId.startsWith("demo-");
  }

  /* Authenticate with Firebase for users with access to workflows */
  async authenticate(
    auth0Token: string,
    appMetadata?: UserAppMetadata
  ): Promise<ReturnType<typeof signInWithCustomToken> | undefined> {
    const shouldGenerateToken =
      appMetadata?.stateCode === "recidiviz" ||
      isOfflineMode() ||
      appMetadata?.routes?.workflows;

    if (shouldGenerateToken) {
      const firebaseToken = await fetchFirebaseToken(auth0Token);
      const auth = getAuth(this.app);
      if (this.useOfflineFirestore) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      return signInWithCustomToken(auth, firebaseToken);
    }
  }

  /* Fetch impersonated Firebase token */
  async authenticateImpersonatedUser(
    impersonatedEmail: string,
    impersonatedStateCode: string,
    getTokenSilently: UserStore["getTokenSilently"],
    appMetadata?: UserAppMetadata
  ): Promise<ReturnType<typeof signInWithCustomToken> | undefined> {
    const shouldGenerateToken = appMetadata?.stateCode === "recidiviz";
    if (shouldGenerateToken) {
      const firebaseToken = await fetchImpersonatedFirebaseToken(
        impersonatedEmail,
        impersonatedStateCode,
        getTokenSilently
      );
      const auth = getAuth(this.app);
      if (this.useOfflineFirestore) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      return signInWithCustomToken(auth, firebaseToken);
    }
  }

  async getClient(
    clientId: string,
    stateCode: string
  ): Promise<ClientRecord | undefined> {
    // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
    const results = await getDocs(
      query(
        collection(this.db, collectionNames.clients),
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

  async getResident(
    residentId: string,
    stateCode: string
  ): Promise<ResidentRecord | undefined> {
    // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
    const results = await getDocs(
      query(
        collection(this.db, collectionNames.residents),
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

  /**
   * All updates to Firestore should utilitize this method, which first checks that the user is an impersonator.
   * Do not use the Firestore setDoc directly.
   */
  updateDocument(
    documentType: string,
    recordId: string,
    docRef: DocumentReference<DocumentData>,
    update: any
  ) {
    if (this.rootStore.isImpersonating) {
      // eslint-disable-next-line
      console.log(
        `[IMPERSONATOR] Skipping update for: ${documentType} for id ${recordId} with updates ${JSON.stringify(
          update
        )}`
      );
      return;
    }
    // eslint-disable-next-line no-restricted-syntax
    return setDoc(docRef, { ...update }, { merge: true });
  }

  // Function to add an update in `clientUpdatesV2`. All JusticeInvolvedPerson updates (both Clients and Residents)
  // are being stored in `clientUpdatesv2`, so the name of the collection is misleading, all person updates are stored here.
  async updatePerson(
    recordId: string,
    update: Record<PersonUpdateType, string | ContactMethodType>
  ) {
    const docRef = doc(this.db, collectionNames.clientUpdatesV2, `${recordId}`);

    return this.updateDocument(
      collectionNames.clientUpdatesV2,
      recordId,
      docRef,
      { ...update }
    );
  }

  async updateOpportunity(
    opportunityType: OpportunityType,
    recordId: string,
    update: PartialWithFieldValue<
      OpportunityUpdateWithForm<Record<string, any>>
    >
  ) {
    const opportunityDocRef = doc(
      this.db,
      collectionNames.clientUpdatesV2,
      `${recordId}/${collectionNames.clientOpportunityUpdates}/${opportunityType}`
    );

    return this.updateDocument(opportunityType, recordId, opportunityDocRef, {
      ...update,
    });
  }

  async updateOpportunityDenial(
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

    return this.updateOpportunity(opportunityType, recordId, changes);
  }

  async updateOpportunityCompleted(
    userEmail: string,
    recordId: string,
    opportunityType: OpportunityType,
    clearCompletion = false
  ): Promise<void> {
    return this.updateOpportunity(opportunityType, recordId, {
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

  async updateOpportunityFirstViewed(
    userEmail: string,
    recordId: string,
    opportunityType: OpportunityType
  ): Promise<void> {
    return this.updateOpportunity(opportunityType, recordId, {
      firstViewed: { by: userEmail, date: serverTimestamp() },
    });
  }

  updateSelectedSearchIds(
    userEmail: string,
    stateCode: string,
    selectedSearchIds: string[]
  ): Promise<void> | undefined {
    return this.updateDocument(
      collectionNames.userUpdates,
      userEmail,
      doc(this.db, collectionNames.userUpdates, userEmail),
      {
        stateCode,
        selectedSearchIds,
        // selectedOfficerIds was renamed to selectedSearchIds, so delete the old field to make
        // the data a bit more manageable.
        selectedOfficerIds: deleteField(),
      }
    );
  }

  async updateFormDraftData(
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

    await this.updateOpportunity(type, person.recordId, update);

    this.rootStore.analyticsStore.trackReferralFormEdited({
      justiceInvolvedPersonId: person.pseudonymizedId,
      opportunityType: type,
    });

    if (isFirstEdit) {
      this.rootStore.analyticsStore.trackReferralFormFirstEdited({
        justiceInvolvedPersonId: person.pseudonymizedId,
        opportunityType: type,
      });
    }

    if (opportunity.reviewStatus === "PENDING") {
      this.rootStore.analyticsStore.trackSetOpportunityStatus({
        justiceInvolvedPersonId: person.pseudonymizedId,
        status: "IN_PROGRESS",
        opportunityType: type,
      });
    }
  }

  async updateUsTnExpirationContactNoteStatus(
    opportunity: UsTnExpirationOpportunity,
    recordId: string,
    contactNote: Record<number, string[]>,
    submittedTimestamp: Timestamp,
    status: ExternalSystemRequestStatus,
    error?: string
  ) {
    // Ignore recidiviz and non-state users in prod
    if (
      process.env.REACT_APP_DEPLOY_ENV === "production" &&
      opportunity.rootStore.userStore.stateCode !== opportunity.person.stateCode
    )
      return;

    const contactNoteUpdate: UsTnExpirationOpportunityUpdate = {
      contactNote: {
        status,
        submitted: {
          by: opportunity.currentUserEmail || "user",
          date: submittedTimestamp,
        },
        note: contactNote,
        noteStatus: {},
        ...(error !== undefined && { error }),
      },
    };

    return this.updateOpportunity(
      opportunity.type,
      recordId,
      contactNoteUpdate
    );
  }
}
