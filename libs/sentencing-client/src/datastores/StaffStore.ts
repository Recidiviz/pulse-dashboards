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

import { makeAutoObservable } from "mobx";

import { FlowMethod } from "~hydration-utils";
import { PSIStore } from "~sentencing-client";

import { APIClient, Staff } from "../api/APIClient";

export class StaffStore {
  staffInfo?: Staff;

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadStaffInfo(): FlowMethod<APIClient["getStaffInfo"], void> {
    if (this.staffInfo) return;
    this.staffInfo = yield this.psiStore.apiClient.getStaffInfo();
  }
}
