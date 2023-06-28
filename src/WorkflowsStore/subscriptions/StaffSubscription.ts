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

import {
  collectionNames,
  StaffRecord,
  SYSTEM_ID_TO_CASELOAD_FIELD,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class StaffSubscription extends FirestoreQuerySubscription<StaffRecord> {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    super();
    this.rootStore = rootStore;
  }

  get dataSource(): Query {
    const { caseloadDistrict, workflowsSupportedSystems, activeSystem } =
      this.rootStore.workflowsStore;

    const stateCode = this.rootStore.currentTenantId;
    const constraints = [where("stateCode", "==", stateCode)];

    // If there's more than 1 supported system, then we query for all staff within the state.
    if (
      workflowsSupportedSystems &&
      activeSystem &&
      activeSystem !== "ALL" &&
      workflowsSupportedSystems.length === 1
    ) {
      constraints.push(
        where(SYSTEM_ID_TO_CASELOAD_FIELD[activeSystem], "==", true)
      );
    }

    if (caseloadDistrict) {
      constraints.push(where("district", "==", caseloadDistrict));
    }

    return query(
      collection(this.rootStore.firestoreStore.db, collectionNames.staff),
      ...constraints
    );
  }
}
