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

import { and, or, Query, query, where } from "firebase/firestore";

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
    const { search } =
      this.rootStore.workflowsStore.systemConfigFor("INCARCERATION");

    const stateCode = this.rootStore.currentTenantId;
    if (!stateCode) return;

    // The conditions that are applied with a logical OR
    // A person should match if they match searchId1 OR searchId2
    const orConditions = search
      .filter((s) => s.searchType === "LOCATION")
      .map((searchConfig) => {
        const whereClause = where(
          "idType",
          "==",
          searchConfig.locationIdType ?? searchConfig.searchField[0],
        );
        return whereClause;
      });

    // The conditions that are applied with a logical AND
    // A person should match if they have a specific stateCode AND they match any of the searchIds
    const andConditions = [
      where("stateCode", "==", stateCode),
      or(...orConditions),
    ];

    const constraints = and(...andConditions);

    return query(
      this.rootStore.firestoreStore.collection({ key: "locations" }),
      constraints,
    );
  }
}
