/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { DocumentData } from "@google-cloud/firestore";
import { and, or, Query, query, where } from "firebase/firestore";
import { z } from "zod";

import { FirestoreCollectionKey } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { FirestoreQuerySubscription } from "./FirestoreQuerySubscription";

export class StaffSubscription<
  RecordType extends DocumentData,
> extends FirestoreQuerySubscription<RecordType> {
  constructor(
    private rootStore: RootStore,
    private collectionKey: FirestoreCollectionKey,
    parser: z.ZodType<RecordType, any, any>,
  ) {
    super(parser.parse);
  }

  get dataSource(): Query {
    const { user } = this.rootStore.workflowsStore;

    const activeFeatureVariants =
      this.rootStore.userStore.activeFeatureVariants;
    const stateCode = this.rootStore.currentTenantId;
    const stateCodeConstraint = [where("stateCode", "==", stateCode)];
    const compositeConstraint = [];

    if (user) {
      const staffFilter = this.rootStore.tenantStore.workflowsStaffFilterFn(
        user,
        activeFeatureVariants,
      );
      if (staffFilter) {
        const staffFilterConstraint = where(
          staffFilter.filterField,
          "in",
          staffFilter.filterValues,
        );
        const constraint = activeFeatureVariants.workflowsSupervisorSearch
          ? or(
              where("supervisorExternalId", "==", user.info.id), // allows user to also see staff they supervise outside of their district
              staffFilterConstraint,
            )
          : staffFilterConstraint;
        compositeConstraint.push(constraint);
      }
    }

    const { collectionKey } = this;
    const firestoreCollection = this.rootStore.firestoreStore.collection(
      this.collectionKey,
    );

    const stateCodeConstraintQuery = query(
      firestoreCollection,
      ...stateCodeConstraint,
    );
    const compositeQuery = query(
      firestoreCollection,
      and(...stateCodeConstraint, ...compositeConstraint),
    );
    const finalQuery =
      compositeConstraint.length > 0
        ? compositeQuery
        : stateCodeConstraintQuery;

    return finalQuery.withConverter({
      fromFirestore(snapshot, options) {
        const doc = snapshot.data(options);
        return { ...doc, recordId: snapshot.id };
      },
      // these collections are read-only, so this should never be used, but it is required by Firestore
      toFirestore(record: any) {
        throw new Error(`Writing to ${collectionKey} is not allowed`);
      },
    });
  }
}
