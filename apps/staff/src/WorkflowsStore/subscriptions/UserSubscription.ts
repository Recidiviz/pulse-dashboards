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

import {
  collection,
  DocumentData,
  limit,
  Query,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { computed, makeObservable, override } from "mobx";

import { isUserRecord, StaffRecord, UserRecord } from "../../FirestoreStore";
import { FIRESTORE_COLLECTIONS_MAP } from "../../FirestoreStore/constants";
import { RootStore } from "../../RootStore";
import { splitAuth0UserName } from "../../utils/formatStrings";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";
import { ValidateFunction } from "./types";

const validateUserRecord: ValidateFunction<UserRecord> = (doc) => {
  if (!doc) throw new Error("No record to validate");
  if (!isUserRecord(doc as StaffRecord)) throw new Error("Invalid user record");
};

/**
 * stubs out the minimum properties required by FirestoreQuerySubscription.updateData
 */
function mockOverrideSnapshot(record: StaffRecord) {
  const resultsSubstitute = [{ data: () => record }];
  return {
    forEach: resultsSubstitute.forEach.bind(resultsSubstitute),
  } as unknown as QuerySnapshot;
}

export class UserSubscription extends FirestoreQuerySubscription<UserRecord> {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    super(undefined, validateUserRecord);
    this.rootStore = rootStore;
    makeObservable<this, "updateData">(this, {
      updateData: override,
      subscribe: override,
      dataOverride: computed,
    });
  }

  get dataSource(): Query<DocumentData> | undefined {
    const {
      userStore: { stateCode, userIsLoading },
      currentTenantId,
      user,
      firestoreStore,
    } = this.rootStore;
    const email = user?.email;
    // this should not happen if the user is authorized
    if (!email || userIsLoading) return;
    // only RECIDIVIZ users can cross state boundaries
    if (stateCode !== currentTenantId && stateCode !== "RECIDIVIZ") return;

    return query(
      collection(firestoreStore.db, FIRESTORE_COLLECTIONS_MAP.staff),
      where("email", "==", email.toLowerCase()),
      where("stateCode", "==", currentTenantId),
      limit(1),
    );
  }

  /**
   * For external users who do not have a caseload, we supplement the user record with additional properties.
   */
  get userWithoutCaseload(): StaffRecord | undefined {
    const {
      user,
      userStore: { stateCode, district, externalId },
    } = this.rootStore;

    if (!user || !user.email) return;

    let formattedUserName;

    if (user.name) formattedUserName = splitAuth0UserName(user.name);

    return {
      id:
        externalId ?? `${stateCode.toLowerCase()}_${user?.email.toLowerCase()}`,
      email: user.email.toLowerCase(),
      stateCode,
      hasCaseload: false,
      hasFacilityCaseload: false,
      givenNames: (user.given_name || formattedUserName?.firstName) ?? "",
      surname: (user.family_name || formattedUserName?.lastName) ?? "",
      district,
    };
  }

  /**
   * For internal users, we will construct a local override instead of expecting any data from Firestore
   */
  get dataOverride(): StaffRecord | undefined {
    const {
      currentTenantId,
      user,
      userStore: { stateCode },
    } = this.rootStore;

    let injectedUserData: StaffRecord | undefined;

    // inject dynamic fixture data in offline mode
    if (isOfflineMode()) {
      injectedUserData = {
        id: `${stateCode.toLowerCase()}_${user?.email}`,
        email: user?.email || "",
        stateCode,
        hasCaseload: false,
        hasFacilityCaseload: false,
        givenNames: user?.name || "Demo",
        surname: "",
      };
    }
    // there are no records in Firestore for Recidiviz users;
    // construct a record that will grant them universal access
    else if (stateCode === "RECIDIVIZ") {
      let formattedUserName;

      if (user?.name) formattedUserName = splitAuth0UserName(user.name);

      injectedUserData = {
        id: "RECIDIVIZ",
        email: user?.email ?? "",
        // should not be undefined if we've gotten this far
        stateCode: currentTenantId as string,
        hasCaseload: false,
        hasFacilityCaseload: false,
        givenNames: (user?.given_name || formattedUserName?.firstName) ?? "",
        surname: (user?.family_name || formattedUserName?.lastName) ?? "",
      };
    }
    return injectedUserData;
  }

  subscribe(): void {
    super.subscribe();
    const { dataOverride } = this;

    if (dataOverride) {
      // deactivate Firestore listener since we are overriding it anyway
      this.cancelSnapshotListener?.();
      // trigger immediately since there is nothing to subscribe to;
      // update method will handle the actual data injection
      this.updateData(undefined);
    }
  }

  protected updateData(
    snapshot: QuerySnapshot<DocumentData> | undefined,
  ): void {
    const { user } = this.rootStore;
    // Prioritize overrides
    if (this.dataOverride) {
      return super.updateData(mockOverrideSnapshot(this.dataOverride));
    }
    if (snapshot?.size) {
      return super.updateData(snapshot);
    }
    if (user && this.userWithoutCaseload) {
      return super.updateData(mockOverrideSnapshot(this.userWithoutCaseload));
    }
    this.hydrationState = {
      status: "failed",
      error: new Error("No user record found"),
    };
    this.data = [];
  }
}