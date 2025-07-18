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

import { captureException } from "@sentry/react";
import { keyBy } from "lodash";
import { flowResult, makeAutoObservable, runInAction } from "mobx";
import toast from "react-hot-toast";

import { isDemoMode } from "~client-env-utils";
import { palette } from "~design-system";
import { FlowMethod } from "~hydration-utils";

import {
  APIClient,
  Case,
  Client,
  Counties,
  Insight,
  Offenses,
  Opportunities,
} from "../api/APIClient";
import { FormAttributes } from "../components/CaseDetails/types";
import { filterExcludedAttributes } from "../geoConfigs/utils";
import { titleCase } from "../utils/utils";
import { ERROR_TOAST_DURATION } from "./constants";
import { PSIStore } from "./PSIStore";
import { CaseAttributes } from "./types";

export class CaseStore {
  caseDetailsById: { [id: string]: Case };

  communityOpportunities: Opportunities;

  offenses: Offenses;

  counties: Counties;

  insight?: Insight;

  insightLoading?: boolean;

  activeCaseId?: string;

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
    this.caseDetailsById = {};
    this.communityOpportunities = [];
    this.offenses = [];
    this.counties = [];
    this.insight = undefined;
    this.activeCaseId = undefined;
    this.insightLoading = false;
  }

  get stateCode() {
    return this.psiStore.stateCode;
  }

  get offensesByName() {
    return keyBy(this.offenses, (offense) => offense.name);
  }

  get caseAttributes(): CaseAttributes {
    if (!this.activeCaseId) return {};
    const currentCase = this.caseDetailsById[this.activeCaseId];
    if (currentCase.client?.fullName) {
      currentCase.client.fullName = titleCase(currentCase.client?.fullName);
    }
    const config = this.psiStore.geoConfig;

    const caseAttributes: CaseAttributes = {
      ...currentCase,
      clientGender: currentCase.client?.gender,
    };

    const exclusionFilter = filterExcludedAttributes(
      config.excludedAttributeKeys,
    );

    const filteredCaseAttributes = Object.entries(caseAttributes)
      .filter(([key]) => exclusionFilter({ key }))
      .reduce((acc, [key, value]) => {
        // @ts-expect-error TODO(Recidiviz/recidiviz-data#35771) Debug TypeScript conflict in `value`
        acc[key as keyof CaseAttributes] = value;
        return acc;
      }, {} as CaseAttributes);

    return filteredCaseAttributes;
  }

  setActiveCaseId(caseId: string) {
    this.activeCaseId = caseId;
  }

  async getInsight(
    offense?: string,
    lsirScore?: number,
    isSexOffense?: boolean | null,
    isViolentOffense?: boolean | null,
  ): Promise<Insight | undefined> {
    if (!this.activeCaseId || !offense || (lsirScore !== 0 && !lsirScore))
      return;

    const currentCase = this.caseDetailsById[this.activeCaseId];
    const gender = currentCase.client?.gender;
    if (!gender) return;

    runInAction(() => {
      this.insightLoading = true;
    });

    await flowResult(
      this.loadInsight(
        offense,
        gender,
        lsirScore,
        isSexOffense,
        isViolentOffense,
      ),
    );

    runInAction(() => {
      this.insightLoading = false;
    });

    return this.insight;
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
      captureException(new Error("Error while loading case details"), {
        extra: {
          message: `loadCaseDetails error: ${error}`,
          caseId,
          staffId: this.psiStore.staffPseudoId,
        },
      });
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
      captureException(new Error("Error while updating case details"), {
        extra: {
          message: `updateCaseDetails error: ${error}`,
          payload: updates,
          caseId,
          staffId: this.psiStore.staffPseudoId,
        },
      });
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
        yield this.psiStore.apiClient.getCommunityOpportunities(isDemoMode());
    } catch (error) {
      captureException(
        new Error("Error while loading community opportunities"),
        {
          extra: {
            message: `loadCommunityOpportunities error: ${error}`,
            staffId: this.psiStore.staffPseudoId,
          },
        },
      );
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
      captureException(new Error("Error while loading offenses"), {
        extra: {
          message: `loadOffenses error: ${error}`,
          staffId: this.psiStore.staffPseudoId,
        },
      });
      toast(
        "Something went wrong loading a list of offenses. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *loadCounties() {
    try {
      const counties: Counties = yield this.psiStore.apiClient.getCounties();
      this.counties = counties;
    } catch (error) {
      captureException(new Error("Error while loading counties"), {
        extra: {
          message: `loadCounties error: ${error}`,
          staffId: this.psiStore.staffPseudoId,
        },
      });
      toast(
        "Something went wrong loading a list of counties. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  *loadInsight(
    offense: string,
    gender: Client["gender"],
    lsirScore: number,
    isSexOffense?: boolean | null,
    isViolentOffense?: boolean | null,
  ) {
    try {
      this.insight = yield this.psiStore.apiClient.getInsight(
        offense,
        gender,
        lsirScore,
        isSexOffense,
        isViolentOffense,
      );
      return this.insight;
    } catch (error) {
      captureException(new Error("Error while loading insights"), {
        extra: {
          message: `loadInsight error: ${error}`,
          payload: {
            offense,
            gender,
            lsirScore,
          },
          staffId: this.psiStore.staffPseudoId,
        },
      });
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
