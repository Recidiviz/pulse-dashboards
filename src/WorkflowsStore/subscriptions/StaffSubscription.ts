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

import { collection, Query, query, where } from "firebase/firestore";

import { collectionNames, db, StaffRecord } from "../../firestore";
import { RootStore } from "../../RootStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class StaffSubscription extends FirestoreQuerySubscription<StaffRecord> {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    super();
    this.rootStore = rootStore;
  }

  get dataSource(): Query {
    const district = this.rootStore.workflowsStore.caseloadDistrict;

    const stateCode = this.rootStore.currentTenantId;

    const constraints = [
      where("stateCode", "==", stateCode),
      where("hasCaseload", "==", true),
    ];

    if (district) {
      constraints.push(where("district", "==", district));
    }

    return query(collection(db, collectionNames.staff), ...constraints);
  }
}