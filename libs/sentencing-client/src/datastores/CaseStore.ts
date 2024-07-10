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

import { APIClient, Case } from "../api/APIClient";
import { TransformedFormUpdates } from "../components/CaseDetails/types";
import { PSIStore } from "./PSIStore";

export class CaseStore {
  caseDetailsById: { [id: string]: Case };

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
    this.caseDetailsById = {};
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadCaseDetails(
    caseId: string,
  ): FlowMethod<APIClient["getCaseDetails"], void> {
    const caseDetails = yield this.psiStore.apiClient.getCaseDetails(caseId);

    this.caseDetailsById = {
      ...this.caseDetailsById,
      [caseId]: caseDetails,
    };
  }

  *updateCaseDetails(caseId: string, updates?: TransformedFormUpdates) {
    if (!updates) return;
    yield this.psiStore.apiClient.updateCaseDetails(caseId, updates);
  }
}
