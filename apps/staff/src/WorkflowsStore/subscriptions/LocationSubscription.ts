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

import { Query, query, where } from "firebase/firestore";

import { LocationRecord } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class LocationSubscription extends FirestoreQuerySubscription<LocationRecord> {
  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    super();
    this.rootStore = rootStore;
  }

  get dataSource(): Query | undefined {
    const { searchField, activeSystem, locationSearchField } =
      this.rootStore.workflowsStore;
    const stateCode = this.rootStore.currentTenantId;
    if (!stateCode) return;

    const constraints = [where("stateCode", "==", stateCode)];

    if (activeSystem === "ALL" && locationSearchField) {
      /* If activeSystem is ALL, then we need to select the location type's search field. */
      constraints.push(where("idType", "==", locationSearchField));
    } else {
      /* If the activeSystem is already selected, then we can use the computed searchField */
      constraints.push(where("idType", "==", searchField));
    }

    return query(
      this.rootStore.firestoreStore.collection({ key: "locations" }),
      ...constraints,
    );
  }
}
