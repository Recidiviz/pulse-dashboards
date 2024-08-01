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

import { palette } from "@recidiviz/design-system";
import { makeAutoObservable } from "mobx";
import toast from "react-hot-toast";

import { FlowMethod } from "~hydration-utils";

import { APIClient, Case, Opportunities } from "../api/APIClient";
import { MutableCaseAttributes } from "../components/CaseDetails/types";
import { ERROR_TOAST_DURATION } from "./constants";
import { PSIStore } from "./PSIStore";

export class CaseStore {
  caseDetailsById: { [id: string]: Case };

  communityOpportunities: Opportunities;

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
    this.caseDetailsById = {};
    this.communityOpportunities = [];
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadCaseDetails(
    caseId: string,
  ): FlowMethod<APIClient["getCaseDetails"], void> {
    try {
      const caseDetails = yield this.psiStore.apiClient.getCaseDetails(caseId);
      this.caseDetailsById = {
        ...this.caseDetailsById,
        [caseId]: caseDetails,
      };
    } catch (error) {
      toast(
        "Something went wrong loading the case details. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *updateCaseDetails(caseId: string, updates?: MutableCaseAttributes) {
    try {
      if (!updates) return;
      yield this.psiStore.apiClient.updateCaseDetails(caseId, updates);
    } catch (error) {
      toast(
        "Something went wrong updating the case details. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *loadCommunityOpportunities() {
    try {
      this.communityOpportunities =
        yield this.psiStore.apiClient.getCommunityOpportunities();
    } catch (error) {
      toast(
        "Something went wrong loading the community opportunities. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }
}
