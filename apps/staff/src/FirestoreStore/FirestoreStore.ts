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
import { FieldValue } from "@google-cloud/firestore";
import { startOfToday } from "date-fns";
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
import { isHydrated } from "../core/models/utils";
import type RootStore from "../RootStore";
import { UserAppMetadata } from "../RootStore/types";
import UserStore from "../RootStore/UserStore";
import { isDemoMode } from "../utils/isDemoMode";
import { isOfflineMode } from "../utils/isOfflineMode";
import { Opportunity, UsTnExpirationOpportunity } from "../WorkflowsStore";
import { FormBase } from "../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityType } from "../WorkflowsStore/Opportunity/OpportunityConfigs";
import { getMonthYearFromDate } from "../WorkflowsStore/utils";
import { FIRESTORE_GENERAL_COLLECTION_MAP } from "./constants";
import {
  AutoSnoozeUpdate,
  ClientRecord,
  ContactMethodType,
  ExternalSystemRequestStatus,
  FirestoreCollectionKey,
  ManualSnoozeUpdate,
  MilestonesMessage,
  OpportunityUpdateWithForm,
  PersonUpdateType,
  ResidentRecord,
  SupervisionTaskUpdate,
  UsTnExpirationOpportunityUpdate,
} from "./types";

function getFirestoreProjectId() {
  const projectId = process.env.REACT_APP_FIREBASE_BACKEND_PROJECT;
  const testEnv = process.env.REACT_APP_TEST_ENV;
  // Avoid connection attempts to firestore emulator in tests
  if (testEnv) return "test";

  // default to offline mode when missing configuration (e.g. in unit tests)
  if (isOfflineMode() || !projectId) {
    // demo-* is the Firebase magic word for a dummy project
    return "demo-dev";
  }

  return projectId;
}

const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

export default class FirestoreStore {
  rootStore;

  app: FirebaseApp;

  projectId: string = getFirestoreProjectId();

  private db: Firestore;

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
    appMetadata?: UserAppMetadata,
  ): Promise<ReturnType<typeof signInWithCustomToken> | undefined> {
    const shouldGenerateToken =
      appMetadata?.stateCode === "recidiviz" ||
      isOfflineMode() ||
      appMetadata?.routes?.workflowsSupervision ||
      appMetadata?.routes?.workflowsFacilities;

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
    appMetadata?: UserAppMetadata,
  ): Promise<ReturnType<typeof signInWithCustomToken> | undefined> {
    const shouldGenerateToken = appMetadata?.stateCode === "recidiviz";
    if (shouldGenerateToken) {
      const firebaseToken = await fetchImpersonatedFirebaseToken(
        impersonatedEmail,
        impersonatedStateCode,
        getTokenSilently,
      );
      const auth = getAuth(this.app);
      if (this.useOfflineFirestore) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      return signInWithCustomToken(auth, firebaseToken);
    }
  }

  collectionNameForKey(collectionKey: FirestoreCollectionKey) {
    let collectionName = collectionKey.key
      ? FIRESTORE_GENERAL_COLLECTION_MAP[collectionKey.key]
      : collectionKey.raw;
    if (isDemoMode()) collectionName = `DEMO_${collectionName}`;
    return collectionName;
  }

  collection(collectionKey: FirestoreCollectionKey) {
    return collection(this.db, this.collectionNameForKey(collectionKey));
  }

  doc(collectionKey: FirestoreCollectionKey, ...paths: string[]) {
    return doc(this.db, this.collectionNameForKey(collectionKey), ...paths);
  }

  async getClient(
    clientId: string,
    stateCode: string,
  ): Promise<ClientRecord | undefined> {
    // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
    const results = await getDocs(
      query(
        this.collection({ key: "clients" }),
        where("pseudonymizedId", "==", clientId),
        where("stateCode", "==", stateCode),
        limit(1),
      ),
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
    stateCode: string,
  ): Promise<ResidentRecord | undefined> {
    // TODO(#1763) index clients by pseudo ID and go back to a simple getDoc lookup
    const results = await getDocs(
      query(
        this.collection({ key: "residents" }),
        where("pseudonymizedId", "==", residentId),
        where("stateCode", "==", stateCode),
        limit(1),
      ),
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
  updateDocument(docRef: DocumentReference<DocumentData>, update: any) {
    if (this.rootStore.isImpersonating) {
      // eslint-disable-next-line
      console.log(
        `[IMPERSONATOR] Skipping update for: ${docRef.path} with updates ${JSON.stringify(
          update,
        )}`,
      );
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    return setDoc(docRef, { ...update }, { merge: true });
  }

  /**
   * All updates to the `clientUpdatesV2` collection should utilitize this method, which first adds the `stateCode` to the person document,
   * then updates the update document.
   */
  async updateClientUpdatesV2Document(
    recordId: string,
    docRef: DocumentReference<DocumentData>,
    update: any,
  ) {
    if (this.rootStore.isImpersonating) {
      // eslint-disable-next-line
      console.log(
        `[IMPERSONATOR] Skipping update for: ${docRef.path} with updates ${JSON.stringify(
          update,
        )}`,
      );
      return;
    }

    // First add the state code to the `clientUpdatesV2 document
    await this.updatePerson(recordId, { stateCode: recordId.slice(0, 5) });

    // Then update the document with the actual update
    await this.updateDocument(docRef, update);
  }

  // Function to add an update in `clientUpdatesV2`. All JusticeInvolvedPerson updates (both Clients and Residents)
  // are being stored in `clientUpdatesv2`, so the name of the collection is misleading, all person updates are stored here.
  async updatePerson(
    recordId: string,
    update:
      | Record<PersonUpdateType, string | ContactMethodType>
      | Record<"stateCode", string>,
  ) {
    const docRef = this.doc({ key: "clientUpdatesV2" }, `${recordId}`);

    // This is the only place an update should be made to `clientUpdatesV2` without using
    // the `updateClientUpdatesV2` method
    return this.updateDocument(docRef, { ...update });
  }

  async updateSupervisionTask(recordId: string, update: SupervisionTaskUpdate) {
    const taskDocRef = this.doc(
      { key: "clientUpdatesV2" },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.taskUpdates}/supervision`,
    );

    return this.updateClientUpdatesV2Document(recordId, taskDocRef, {
      ...update,
    });
  }

  async updateMilestonesMessages(
    recordId: string,
    update: PartialWithFieldValue<MilestonesMessage>,
  ) {
    const dateKey = `milestones_${getMonthYearFromDate(startOfToday())}`;
    const taskDocRef = this.doc(
      { key: "clientUpdatesV2" },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.milestonesMessages}/${dateKey}`,
    );

    return this.updateClientUpdatesV2Document(recordId, taskDocRef, update);
  }

  async updateOpportunity(
    opportunityType: OpportunityType,
    recordId: string,
    update: PartialWithFieldValue<
      OpportunityUpdateWithForm<Record<string, any>>
    >,
  ) {
    const opportunityDocRef = this.doc(
      { key: "clientUpdatesV2" },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates}/${opportunityType}`,
    );

    return this.updateClientUpdatesV2Document(recordId, opportunityDocRef, {
      ...update,
    });
  }

  async updateOpportunityAutoSnooze(
    opportunityType: OpportunityType,
    recordId: string,
    snoozeUpdate: AutoSnoozeUpdate,
    deleteSnoozeField: boolean,
  ): Promise<void> {
    const changes = deleteSnoozeField
      ? { autoSnooze: deleteField() }
      : {
          autoSnooze: { ...snoozeUpdate },
        };

    return this.updateOpportunity(opportunityType, recordId, changes);
  }

  async updateOpportunityManualSnooze(
    opportunityType: OpportunityType,
    recordId: string,
    snoozeUpdate: ManualSnoozeUpdate,
    deleteSnoozeField: boolean,
  ): Promise<void> {
    const changes = deleteSnoozeField
      ? { manualSnooze: deleteField() }
      : {
          manualSnooze: { ...snoozeUpdate },
        };

    return this.updateOpportunity(opportunityType, recordId, changes);
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
    },
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
    clearCompletion = false,
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

  async updateOpportunityLastViewed(
    userEmail: string,
    recordId: string,
    opportunityType: OpportunityType,
  ): Promise<void> {
    return this.updateOpportunity(opportunityType, recordId, {
      lastViewed: { by: userEmail, date: serverTimestamp() },
    });
  }

  updateSelectedSearchIds(
    userEmail: string,
    stateCode: string,
    selectedSearchIds: string[],
  ): Promise<void> | undefined {
    return this.updateDocument(this.doc({ key: "userUpdates" }, userEmail), {
      stateCode,
      selectedSearchIds,
      // selectedOfficerIds was renamed to selectedSearchIds, so delete the old field to make
      // the data a bit more manageable.
      selectedOfficerIds: deleteField(),
    });
  }

  async clearFormDraftData(form: FormBase<any>) {
    const { opportunity, type } = form;
    const { person } = opportunity;

    await this.updateOpportunity(type, person.recordId, {
      referralForm: deleteField(),
    });
  }

  async updateFormDraftData(
    form: FormBase<any>,
    name: string,
    value: FieldValue | string | number | boolean,
  ): Promise<void> {
    const { opportunity, currentUserEmail, formLastUpdated, type } = form;
    const { person } = opportunity;

    await when(() => isHydrated(opportunity));

    const update = {
      referralForm: {
        updated: {
          by: currentUserEmail,
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
    currentUserEmail: string,
    recordId: string,
    contactNote: Record<number, string[]>,
    submittedTimestamp: Timestamp,
    status: ExternalSystemRequestStatus,
    error?: string,
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
          by: currentUserEmail,
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
      contactNoteUpdate,
    );
  }

  async updateOmsSnoozeStatus(
    opportunity: Opportunity,
    currentUserEmail: string,
    userStateCode: string,
    recordId: string,
    snoozeUntil: string,
    submittedTimestamp: Timestamp,
    status: ExternalSystemRequestStatus,
    error?: string,
  ) {
    // Ignore recidiviz and non-state users in prod
    if (
      process.env.REACT_APP_DEPLOY_ENV === "production" &&
      userStateCode !== opportunity.person.stateCode
    )
      return;

    return this.updateOpportunity(opportunity.type, recordId, {
      omsSnooze: {
        status,
        submitted: {
          by: currentUserEmail,
          date: submittedTimestamp,
        },
        snoozeUntil,
        ...(error !== undefined && { error }),
      },
    });
  }

  async deleteOpportunityDenialAndSnooze(
    opportunityType: OpportunityType,
    recordId: string,
  ) {
    this.updateOpportunity(opportunityType, recordId, {
      denial: deleteField(),
      autoSnooze: deleteField(),
      manualSnooze: deleteField(),
    });
  }
}
