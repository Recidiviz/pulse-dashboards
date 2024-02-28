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

import {
  differenceInCalendarDays,
  formatDistanceStrict,
  nextSunday,
  startOfWeek,
} from "date-fns";
import { computed, makeObservable } from "mobx";

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

// TODO: Add extra tests for dates that round down and up.
export const US_MO_DAYS_PAST = (eligibilityDate: Date, numOfDays?: number) => {
  const daysPast =
    numOfDays ?? differenceInCalendarDays(eligibilityDate, new Date());
  return daysPast === 0
    ? "today"
    : formatDistanceStrict(eligibilityDate, new Date(), {
        unit: "day",
        addSuffix: true,
        roundingMethod: daysPast > 0 ? "ceil" : "floor",
      });
};

export abstract class UsMoOverdueRestrictiveHousingBase<
  ReferralRecord extends BaseUsMoOverdueRestrictiveHousingReferralRecord,
> extends OpportunityBase<Resident, ReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

  readonly isAlert = true;

  constructor(
    resident: Resident,
    type: OpportunityType,
    transformReferral?: TransformFunction<ReferralRecord>,
    validateRecord?: ValidateFunction<ReferralRecord>,
  ) {
    super(
      resident,
      type,
      resident.rootStore,
      transformReferral,
      validateRecord,
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

  /**
   * Generates the message that informs the user when the opportunity was or is due. It uses the eligibilityDate to determine if the
   * sentence's verb and prepositional temporal phrase should be in the past, present, or future tense.
   * @param subject the noun that describes the opportunity (e.g. `Segregation period`, `Hearing`)
   * @param tenseVerbs the verb(s) of the sentence that indicates the subject's state in time.
   *  Can be an array of `[past: string, presentAndFuture: string]` or a single word if it works for all tenses. (e.g. `overdue`, `['was due', 'is due']`).
   * @returns the message indicating the status of the opportunity `${subject} ${(tense)Verb} ${prepositional phrase}`
   * @example
   * // Example 1: Eligibility date in the past and array instead of string for `tenseVerbs`
   * this.eligibilityDate = new Date('2023-01-01'); // assume that today is '2023-01-04'
   * const message1 = this.generateUsMoOverdueEligibilityStatusMessage('Your application', ['was due', 'is due']);
   * console.log(message1); // Output: "Your application was due 3 days ago."
   *
   *  @example
   * // Example 2: Eligibility date is today and string instead of array for `tenseVerbs`
   * this.eligibilityDate = new Date(); // Assuming today is 2023-01-04
   * const message2 = this.generateUsMoOverdueEligibilityStatusMessage('Hearing', 'due');
   * console.log(message2); // Output: "Hearing due today."
   */
  generateUsMoOverdueEligibilityStatusMessage(
    subject: string,
    tenseVerbs: [past: string, presentAndFuture: string] | string,
  ): string {
    const { eligibilityDate } = this;
    if (!eligibilityDate) return "Date(s) are unknown";

    // START: Message construction

    /**
     * Determines the tense of the message.
     */
    const numOfDays = differenceInCalendarDays(eligibilityDate, new Date());

    /**
     * if the number of days is negative, the verb should be in the past tense (i.e. `tenseVerbs[0]` | `tenseVerbs`)
     * otherwise, the present and future tense (i.e. `tenseVerbs[1]` | `tenseVerbs`).
     */
    let verb;
    if (Array.isArray(tenseVerbs))
      verb = numOfDays < 0 ? tenseVerbs[0] : tenseVerbs[1];
    else if (tenseVerbs === undefined) verb = tenseVerbs;
    else verb = tenseVerbs;

    /**
     * if the number of days is negative, the sentence should be in the past tense (i.e. `formatDistanceStrict(..)`)
     * otherwise, it should be in the present or future tense (i.e. `today`, `in X days`, `X days ago`)
     */
    const prepositionalPhrase = US_MO_DAYS_PAST(eligibilityDate, numOfDays);

    // END: Message construction

    // filter out empty words and return the words joined together
    return [subject, verb, prepositionalPhrase].filter(Boolean).join(" ");
  }
}
