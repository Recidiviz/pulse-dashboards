// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { nextSunday, startOfWeek } from "date-fns";
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { TransformFunction, ValidateFunction } from "../../../subscriptions";
import { OTHER_KEY } from "../../../utils";
import { CopyTuple, OpportunityType } from "../..";
import { OpportunityBase } from "../../OpportunityBase";
import { Component, Opportunity, OpportunityTab } from "../../types";
import { BaseUsMoOverdueRestrictiveHousingReferralRecord } from "./UsMoOverdueRestrictiveHousingReferralRecord";

export const usMoNoActiveD1Sanctions: CopyTuple<"usMoNoActiveD1Sanctions"> = [
  "usMoNoActiveD1Sanctions",
  {
    text: "No active D1 sanctions",
  },
];

export const usMoInRestrictiveHousing: CopyTuple<"usMoInRestrictiveHousing"> = [
  "usMoInRestrictiveHousing",
  {
    text: "In a Restrictive Housing cell",
  },
];

export abstract class UsMoOverdueRestrictiveHousingBase<
  ReferralRecord extends BaseUsMoOverdueRestrictiveHousingReferralRecord
> extends OpportunityBase<Resident, ReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

  readonly isAlert = true;

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MO;

  constructor(
    resident: Resident,
    type: OpportunityType,
    transformReferral?: TransformFunction<ReferralRecord>,
    validateRecord?: ValidateFunction<ReferralRecord>
  ) {
    super(
      resident,
      type,
      resident.rootStore,
      transformReferral,
      validateRecord
    );
    makeObservable(this, {
      requirementsMet: computed,
    });
  }

  denialReasonsMap = {
    [OTHER_KEY]: "Other",
  };

  /**
   * The tab title for this opportunity.
   * If the opportunity is overdue, the tab title will be "Overdue as of <sync date (every Monday)>".
   * If the opportunity is due before the next sync date, the tab title will be "Due this Week".
   * Otherwise, the tab title will be "Other".
   *
   * @type {OpportunityTab}
   * @memberof UsMoOverdueRestrictiveHousingBase
   */
  get tabTitle(): OpportunityTab {
    const { eligibilityDate } = this;
    if (!eligibilityDate) return "Missing Review Date";
    if (this.denied) return this.deniedTabTitle;

    if (eligibilityDate) {
      const mostRecentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
      if (eligibilityDate < mostRecentMonday)
        return `Overdue as of ${formatWorkflowsDate(mostRecentMonday)}`;
      if (eligibilityDate < nextSunday(new Date())) return `Due this week`;
      return "Coming up";
    }
    return "Other";
  }

  compare(other: Opportunity): number {
    if (!this.eligibilityDate) return -1;
    if (!other.eligibilityDate) return 1;
    return this.sortByEligibilityDate(other);
  }

  showEligibilityStatus(component: Component): boolean {
    return this.reviewStatus === "DENIED" || component === "OpportunityCapsule";
  }
}
