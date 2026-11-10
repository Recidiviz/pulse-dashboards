// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeAutoObservable, observable } from "mobx";

import { USER_ROLE } from "~@idaho-th/shared";

import { TAB_IDS } from "../components/PreviewModal/constants";
import type {
  HomePlanModalState,
  PreviewTab,
} from "../components/PreviewModal/types";
import type { IdahoTHStore } from "./IdahoTHStore";

export class PreviewModalStore {
  private _activeTab: PreviewTab | null = null;
  private _initialTab: PreviewTab | null = null;
  /** Lives here so other tabs can open a Home Plan modal (e.g. Approvals). */
  homePlanModal: HomePlanModalState = null;

  constructor(public parent: IdahoTHStore) {
    makeAutoObservable(this, { homePlanModal: observable.ref });
  }

  private get roleDefaultTab(): PreviewTab {
    return this.parent.rootStore.userStore.user?.role === USER_ROLE.PROVIDER
      ? TAB_IDS.APPLICATION_DETAILS
      : TAB_IDS.PROVIDERS;
  }

  get activeTab(): PreviewTab {
    return this._activeTab ?? this._initialTab ?? this.roleDefaultTab;
  }

  setInitialTab(tab: PreviewTab): void {
    this._activeTab = null;
    this._initialTab = tab;
  }

  setActiveTab(tab: PreviewTab): void {
    this._activeTab = tab;
  }

  setHomePlanModal(modal: HomePlanModalState): void {
    this.homePlanModal = modal;
  }

  reset(): void {
    this._activeTab = null;
    this._initialTab = null;
    this.homePlanModal = null;
  }
}
