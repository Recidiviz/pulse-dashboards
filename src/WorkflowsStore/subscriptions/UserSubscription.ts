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
import { makeObservable, override } from "mobx";

import {
  collectionNames,
  db,
  isUserRecord,
  StaffRecord,
  UserRecord,
} from "../../firestore";
import { RootStore } from "../../RootStore";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";
import { ValidateFunction } from "./types";

const validateUserRecord: ValidateFunction<UserRecord> = (doc) => {
  if (!doc) throw new Error("No record to validate");
  if (isUserRecord(doc as StaffRecord)) {
    return doc as UserRecord;
  }
  throw new Error("Invalid user record");
};

export class UserSubscription extends FirestoreQuerySubscription<UserRecord> {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    super(undefined, validateUserRecord);
    this.rootStore = rootStore;
    makeObservable<this, "updateData">(this, { updateData: override });
  }

  get dataSource(): Query<DocumentData> | undefined {
    const {
      userStore: { stateCode },
      currentTenantId,
      user,
    } = this.rootStore;
    const email = user?.email;
    // this should not happen if the user is authorized
    if (!email) return;
    // only RECIDIVIZ users can cross state boundaries
    if (stateCode !== currentTenantId && stateCode !== "RECIDIVIZ") return;

    return query(
      collection(db, collectionNames.staff),
      where("email", "==", email.toLowerCase()),
      where("stateCode", "==", currentTenantId),
      limit(1)
    );
  }

  protected updateData(
    snapshot: QuerySnapshot<DocumentData> | undefined
  ): void {
    // in some cases below we may need to override the Firestore query results;
    // because the application requires a user record to hydrate and bootstrap itself,
    // we simplify logic elsewhere by just injecting it here
    let injectedUserData: StaffRecord | undefined;

    const {
      currentTenantId,
      user,
      userStore: { stateCode },
    } = this.rootStore;

    // inject dynamic fixture data in offline mode
    if (isOfflineMode()) {
      injectedUserData = {
        id: `${stateCode.toLowerCase()}_${user?.email}`,
        email: user?.email ?? null,
        stateCode,
        hasCaseload: false,
        givenNames: user?.name || "Demo",
        surname: "",
      };
    }
    // there are no records in Firestore for Recidiviz users;
    // construct a record that will grant them universal access
    else if (stateCode === "RECIDIVIZ") {
      injectedUserData = {
        id: "RECIDIVIZ",
        email: user?.email ?? null,
        // should not be undefined if we've gotten this far
        stateCode: currentTenantId as string,
        hasCaseload: false,
        givenNames: "Recidiviz",
        surname: "Staff",
      };
    }

    if (injectedUserData) {
      // mock the snapshot interface for the superclass with the minimal properties required
      const resultsSubstitute = [{ data: () => injectedUserData }];
      const snapshotSubstitute = ({
        forEach: resultsSubstitute.forEach.bind(resultsSubstitute),
      } as unknown) as QuerySnapshot;
      super.updateData(snapshotSubstitute);
    }
    // if we haven't injected OR received a record, the result should be considered invalid;
    // the application cannot function without a user record
    else if (snapshot?.size === 0) {
      this.isLoading = false;
      this.isHydrated = false;
      this.error = new Error("No user record found");
      this.data = [];
    } else {
      super.updateData(snapshot);
    }
  }
}
