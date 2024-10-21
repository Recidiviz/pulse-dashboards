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
import { captureException } from "@sentry/react";
import { makeAutoObservable } from "mobx";
import toast from "react-hot-toast";

import { FlowMethod } from "~hydration-utils";

import {
  APIClient,
  Case,
  Client,
  Insight,
  Offenses,
  Opportunities,
} from "../api/APIClient";
import { FormAttributes } from "../components/CaseDetails/types";
import { ERROR_TOAST_DURATION } from "./constants";
import { PSIStore } from "./PSIStore";

export class CaseStore {
  caseDetailsById: { [id: string]: Case };

  communityOpportunities: Opportunities;

  offenses: Offenses;

  insight?: Insight;

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
    this.caseDetailsById = {};
    this.communityOpportunities = [];
    this.offenses = [];
    this.insight = undefined;
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
      captureException(error);
      toast(
        "Something went wrong loading the case details. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *updateCaseDetails(caseId: string, updates?: FormAttributes) {
    try {
      if (!updates) return;
      yield this.psiStore.apiClient.updateCaseDetails(caseId, updates);
    } catch (error) {
      captureException(error);
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
      captureException(error);
      toast(
        "Something went wrong loading the community opportunities. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *loadOffenses() {
    try {
      const offenses: Offenses = yield this.psiStore.apiClient.getOffenses();
      // Sorted by frequency with alphabetical sorting applied to items that have the same frequency
      this.offenses = offenses
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      captureException(error);
      toast(
        "Something went wrong loading a list of offenses. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *loadInsight(offense: string, gender: Client["gender"], lsirScore: number) {
    try {
      this.insight = yield this.psiStore.apiClient.getInsight(
        offense,
        gender,
        lsirScore,
      );
      return this.insight;
    } catch (error) {
      captureException(error);
      toast(
        "Something went wrong loading a list of offenses. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
      return error;
    }
  }
}
