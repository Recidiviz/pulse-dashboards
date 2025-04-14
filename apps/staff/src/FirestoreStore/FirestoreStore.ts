// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { startOfToday } from "date-fns";
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";
import {
  and,
  collection,
  connectFirestoreEmulator,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  or,
  PartialWithFieldValue,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { mapValues, pickBy } from "lodash";
import { makeAutoObservable } from "mobx";

import { isOfflineMode } from "~client-env-utils";
import { ClientRecord, clientRecordSchema, OpportunityType } from "~datatypes";
import {
  collectionNameForKey,
  FIRESTORE_GENERAL_COLLECTION_MAP,
  FirestoreCollectionKey,
} from "~firestore-api";

import { fetchFirebaseToken } from "../api/fetchFirebaseToken";
import type RootStore from "../RootStore";
import { UserAppMetadata } from "../RootStore/types";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
  UsTnExpirationOpportunity,
} from "../WorkflowsStore";
import { getMonthYearFromDate } from "../WorkflowsStore/utils";
import {
  AutoSnoozeUpdate,
  ContactMethodType,
  ExternalSystemRequestStatus,
  FormUpdate,
  ManualSnoozeUpdate,
  MilestonesMessage,
  OpportunityUpdateWithForm,
  PersonUpdateType,
  SupervisionTaskUpdate,
  UsTnExpirationOpportunityUpdate,
  WorkflowsResidentRecord,
} from "./types";

function getFirestoreProjectId() {
  const projectId = import.meta.env.VITE_FIREBASE_BACKEND_PROJECT;
  const testEnv = import.meta.env.VITE_TEST_ENV;
  // Avoid connection attempts to firestore emulator in tests
  if (testEnv) return "test";

  // default to offline mode when missing configuration (e.g. in unit tests)
  if (isOfflineMode() || !projectId) {
    // demo-* is the Firebase magic word for a dummy project
    return "demo-dev";
  }

  return projectId;
}

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

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
    appMetadata: UserAppMetadata,
    impersonatedEmail?: string,
  ): Promise<ReturnType<typeof signInWithCustomToken> | undefined> {
    const shouldGenerateToken =
      appMetadata.stateCode === "recidiviz" ||
      isOfflineMode() ||
      appMetadata.routes?.workflowsSupervision ||
      appMetadata.routes?.workflowsFacilities;

    if (shouldGenerateToken) {
      const impersonationParams = impersonatedEmail
        ? {
            impersonatedEmail,
            impersonatedStateCode: appMetadata.stateCode,
          }
        : undefined;
      const firebaseToken = await fetchFirebaseToken(
        auth0Token,
        impersonationParams,
      );
      const auth = getAuth(this.app);
      if (this.useOfflineFirestore) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      return signInWithCustomToken(auth, firebaseToken);
    }
  }

  collection(collectionKey: FirestoreCollectionKey) {
    return collection(this.db, collectionNameForKey(collectionKey));
  }

  doc(collectionKey: FirestoreCollectionKey, ...paths: string[]) {
    return doc(this.db, collectionNameForKey(collectionKey), ...paths);
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
      return clientRecordSchema.parse({
        ...result.data(),
        recordId: result.id,
      });
  }

  async getClientsForOfficerId(
    stateCode: string,
    officerExternalId: string,
  ): Promise<ClientRecord[]> {
    const results = await getDocs(
      query(
        this.collection({ key: "clients" }),
        where("stateCode", "==", stateCode),
        where("officerId", "==", officerExternalId),
      ),
    );

    return results.docs.map((result) =>
      clientRecordSchema.parse({
        ...result.data(),
        recordId: result.id,
      }),
    );
  }

  async getResident(
    residentId: string,
    stateCode: string,
  ): Promise<WorkflowsResidentRecord | undefined> {
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
        ...(result.data() as Omit<
          WorkflowsResidentRecord,
          "recordId" | "personType"
        >),
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
      // eslint-disable-next-line no-console
      console.log(
        `[IMPERSONATOR] Skipping update for: ${docRef.path} with updates ${JSON.stringify(
          update,
        )}`,
      );
      return;
    }

    if (
      this.rootStore.userStore.isRecidivizUser &&
      import.meta.env.VITE_DEPLOY_ENV === "production"
    ) {
      // eslint-disable-next-line no-console
      console.log(
        `Recidiviz user in prod; Skipping update for: ${docRef.path} with updates ${JSON.stringify(
          update,
        )}`,
      );
      return;
    }

    // First add the state code to the `clientUpdatesV2` document
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

  async updateForm(
    recordId: string,
    update: PartialWithFieldValue<FormUpdate<Record<string, any>>>,
    formId: string,
  ) {
    const taskDocRef = this.doc(
      { key: "clientUpdatesV2" },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.clientFormUpdates}/${formId}`,
    );

    return this.updateClientUpdatesV2Document(recordId, taskDocRef, update);
  }

  async updateOpportunity(
    opportunity: Opportunity,
    update: PartialWithFieldValue<
      OpportunityUpdateWithForm<Record<string, any>>
    >,
  ) {
    const {
      person: { recordId: personRecordId },
      firestoreUpdateDocId,
    } = opportunity;

    const opportunityDocRef = this.doc(
      { key: "clientUpdatesV2" },
      `${personRecordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates}/${firestoreUpdateDocId}`,
    );

    return this.updateClientUpdatesV2Document(
      personRecordId,
      opportunityDocRef,
      {
        ...update,
      },
    );
  }

  async updateOpportunitySubmitted(
    userEmail: string,
    opportunity: Opportunity,
    subcategory?: string,
  ) {
    // firestore rejects undefined values, so filter them out
    const update = pickBy({
      by: userEmail,
      date: serverTimestamp(),
      subcategory: subcategory,
    });
    return this.updateOpportunity(opportunity, {
      submitted: update,
    });
  }

  async updateOpportunityAutoSnooze(
    opportunity: Opportunity,
    snoozeUpdate: AutoSnoozeUpdate,
    deleteSnoozeField: boolean,
  ): Promise<void> {
    const changes = deleteSnoozeField
      ? { autoSnooze: deleteField() }
      : {
          autoSnooze: { ...snoozeUpdate },
        };

    await this.updateSnoozeCompanions(opportunity, changes);
    return this.updateOpportunity(opportunity, changes);
  }

  async updateOpportunityManualSnooze(
    opportunity: Opportunity,
    snoozeUpdate: ManualSnoozeUpdate,
    deleteSnoozeField: boolean,
  ): Promise<void> {
    const changes = deleteSnoozeField
      ? { manualSnooze: deleteField() }
      : {
          manualSnooze: { ...snoozeUpdate },
        };

    await this.updateSnoozeCompanions(opportunity, changes);
    return this.updateOpportunity(opportunity, changes);
  }

  async updateSnoozeCompanions(
    opportunity: Opportunity,
    changes: Record<string, unknown>,
  ): Promise<void[] | undefined> {
    if (!opportunity.snoozeCompanionOpportunities?.length) {
      return;
    }

    return Promise.all(
      opportunity.snoozeCompanionOpportunities.map((opp: Opportunity) =>
        this.updateOpportunity(opp, changes),
      ),
    );
  }

  async updateOpportunityDenial(
    userEmail: string,
    opportunity: Opportunity,
    fieldUpdates: {
      reasons?: string[];
      otherReason?: string;
    },
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

    await this.updateSnoozeCompanions(opportunity, changes);
    return this.updateOpportunity(opportunity, changes);
  }

  async updateOpportunityCompleted(
    userEmail: string,
    opportunity: Opportunity,
    clearCompletion = false,
  ): Promise<void> {
    return this.updateOpportunity(opportunity, {
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
    opportunity: Opportunity,
  ): Promise<void> {
    return this.updateOpportunity(opportunity, {
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
    });
  }

  updateDismissedOpportunityNotificationIds(
    userEmail: string,
    dismissedOpportunityNotificationIds: string[],
  ) {
    return this.updateDocument(this.doc({ key: "userUpdates" }, userEmail), {
      dismissedOpportunityNotificationIds,
    });
  }

  async updateCustomTabOrderings(
    userEmail: string,
    opportunityToUpdate: OpportunityType,
    tabGroupToUpdate: OpportunityTabGroup,
    customTabOrdering: OpportunityTab[],
  ) {
    // Add the new opportunity-ordering pair to the existing record
    const doc = this.doc({ key: "userUpdates" }, userEmail);
    const previousCustomOrderings =
      (await getDoc(doc)).get("customTabOrderings") ?? {};
    const customTabOrderings = {
      ...previousCustomOrderings,
      [opportunityToUpdate]: {
        ...previousCustomOrderings[opportunityToUpdate],
        [tabGroupToUpdate]: customTabOrdering,
      },
    };
    return this.updateDocument(doc, {
      customTabOrderings,
    });
  }

  async updateListViewPreference(userEmail: string, showListView: boolean) {
    const doc = this.doc({ key: "userUpdates" }, userEmail);
    return this.updateDocument(doc, {
      showListView,
    });
  }

  async updateUsTnExpirationContactNoteStatus(
    opportunity: UsTnExpirationOpportunity,
    currentUserEmail: string,
    contactNote: Record<number, string[]>,
    submittedTimestamp: Timestamp,
    status: ExternalSystemRequestStatus,
    error?: string,
  ) {
    // Ignore recidiviz and non-state users in prod
    if (
      import.meta.env.VITE_DEPLOY_ENV === "production" &&
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

    return this.updateOpportunity(opportunity, contactNoteUpdate);
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
      import.meta.env.VITE_DEPLOY_ENV === "production" &&
      userStateCode !== opportunity.person.stateCode
    )
      return;

    return this.updateOpportunity(opportunity, {
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

  async deleteOpportunitySubmitted(opportunity: Opportunity) {
    return this.updateOpportunity(opportunity, {
      submitted: deleteField(),
    });
  }

  async deleteOpportunityDenialAndSnooze(opportunity: Opportunity) {
    const changes = {
      denial: deleteField(),
      autoSnooze: deleteField(),
      manualSnooze: deleteField(),
    };
    await this.updateSnoozeCompanions(opportunity, changes);
    return this.updateOpportunity(opportunity, changes);
  }

  async getOpportunitiesForJIIAndOpportunityType(
    personExternalId: string,
    opportunityTypeCollection: string,
    stateCode: string,
    includeAlmostEligible: boolean,
  ): Promise<DocumentData[]> {
    const isEligibleConstraint = where("isEligible", "==", true);

    const eligibilityConstraint = includeAlmostEligible
      ? or(isEligibleConstraint, where("isAlmostEligible", "==", true))
      : isEligibleConstraint;

    const results = await getDocs(
      query(
        this.collection({ raw: opportunityTypeCollection }),
        and(
          where("externalId", "==", personExternalId),
          where("stateCode", "==", stateCode),
          eligibilityConstraint,
        ),
      ),
    );

    return results.docs.map((result) => result.data());
  }
}
