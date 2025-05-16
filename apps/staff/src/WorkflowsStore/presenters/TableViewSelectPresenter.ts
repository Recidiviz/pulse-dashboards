// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { makeAutoObservable } from "mobx";

import FirestoreStore, { UserUpdateRecord } from "../../FirestoreStore";
import { FeatureVariantRecord } from "../../RootStore/types";
import { CollectionDocumentSubscription } from "../subscriptions";
import { WorkflowsStore } from "../WorkflowsStore";

export interface TableViewSelectInterface {
  showListView: boolean;
}

export class TableViewSelectPresenter implements TableViewSelectInterface {
  private readonly updatesSubscription?: CollectionDocumentSubscription<UserUpdateRecord>;
  private readonly tableViewEnabled: boolean;

  constructor(
    private readonly firestoreStore: FirestoreStore,
    private readonly workflowsStore: WorkflowsStore,
    featureVariants: FeatureVariantRecord,
  ) {
    this.updatesSubscription = this.workflowsStore.userUpdatesSubscription;
    this.tableViewEnabled = !!featureVariants.opportunityTableView;

    makeAutoObservable(this);
  }

  get showListView() {
    return (
      // if the user doesn't have access to table view,
      !this.tableViewEnabled ||
      // or their preference stored in firestore is to show list view
      !!this.updatesSubscription?.data?.showListView
    );
  }

  set showListView(showListView: boolean) {
    this.firestoreStore.updateListViewPreference(showListView);
  }
}
