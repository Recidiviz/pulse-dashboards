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

import { differenceInDays, startOfToday } from "date-fns";
import { makeObservable, override } from "mobx";

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import {
  Component,
  OpportunityRequirement,
  OpportunityTab,
  OpportunityTabGroup,
} from "../../types";
import {
  CriteriaCopy,
  CriteriaFormatters,
  hydrateCriteria,
} from "../../utils/criteriaUtils";
import {
  UsMoRestrictiveHousingStatusHearingReferralRecord,
  usMoRestrictiveHousingStatusHearingSchema,
  validateReferral,
} from "./UsMoRestrictiveHousingStatusHearingReferralRecord";

const daysUntilNextReviewDateString = (nextReviewDate: Date) => {
  const daysUntilNextReviewDate = differenceInDays(
    nextReviewDate,
    // startOfToday is important here because eligibility dates don't have times, so they're
    // parsed as midnight. differenceInDays rounds down, so we need to compare with today's
    // midnight so we don't end up off by one.
    startOfToday(),
  );
  let daysString;
  if (daysUntilNextReviewDate === 0) {
    daysString = "today";
  } else if (daysUntilNextReviewDate === 1) {
    daysString = "tomorrow";
  } else {
    daysString = `in ${daysUntilNextReviewDate} days`;
  }

  return daysString;
};

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMoRestrictiveHousingStatusHearingReferralRecord> =
  {
    eligibleCriteria: {
      usMoOverdueForHearing: {
        REVIEW_DATE: (criteria) =>
          formatWorkflowsDate(criteria?.nextReviewDate),
        DAYS_PAST_REVIEW_DATE: (criteria) => {
          return criteria?.nextReviewDate
            ? differenceInDays(
                startOfToday(),
                criteria.nextReviewDate,
              ).toString()
            : "Unknown";
        },
      },
    },
    ineligibleCriteria: {
      usMoOverdueForHearing: {
        UPCOMING_OR_EMPTY_TEXT: (criteria) => {
          if (!criteria?.nextReviewDate) {
            return "Missing review date";
          }
          const reviewDate = formatWorkflowsDate(criteria.nextReviewDate);
          const daysUntilNextReviewDate = daysUntilNextReviewDateString(
            criteria.nextReviewDate,
          );
          return `Next review date (${reviewDate}) is ${daysUntilNextReviewDate}`;
        },
        UPCOMING_OR_EMPTY_SHORT_TEXT: (criteria) => {
          if (!criteria?.nextReviewDate) {
            return "Missing review date";
          }
          const reviewDate = formatWorkflowsDate(criteria.nextReviewDate);
          return `Upcoming review date (${reviewDate})`;
        },
      },
    },
  };

const CRITERIA_COPY: CriteriaCopy<UsMoRestrictiveHousingStatusHearingReferralRecord> =
  {
    eligibleCriteria: [
      [
        "usMoOverdueForHearing",
        {
          text: "$DAYS_PAST_REVIEW_DATE day(s) overdue for hearing ($REVIEW_DATE)",
        },
      ],
    ],
    ineligibleCriteria: [
      [
        "usMoOverdueForHearing",
        {
          text: "$UPCOMING_OR_EMPTY_TEXT",
        },
      ],
    ],
  };

export class UsMoRestrictiveHousingStatusHearingOpportunity extends OpportunityBase<
  Resident,
  UsMoRestrictiveHousingStatusHearingReferralRecord
> {
  constructor(resident: Resident) {
    super(
      resident,
      "usMoRestrictiveHousingStatusHearing",
      resident.rootStore,
      usMoRestrictiveHousingStatusHearingSchema.parse,
      validateReferral,
    );

    makeObservable(this, {
      requirementsMet: override,
      requirementsAlmostMet: override,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS,
    );
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "ineligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS,
    );
  }

  get eligibleStatusMessage(): string | undefined {
    return this.record?.eligibleCriteria.usMoOverdueForHearing
      ? CRITERIA_FORMATTERS.eligibleCriteria?.usMoOverdueForHearing?.REVIEW_DATE(
          this.record.eligibleCriteria.usMoOverdueForHearing,
          this.record,
        )
      : undefined;
  }

  get almostEligibleStatusMessage(): string | undefined {
    return this.record?.ineligibleCriteria.usMoOverdueForHearing &&
      this.almostEligible
      ? CRITERIA_FORMATTERS.ineligibleCriteria?.usMoOverdueForHearing?.UPCOMING_OR_EMPTY_SHORT_TEXT(
          this.record.ineligibleCriteria.usMoOverdueForHearing,
          this.record,
        )
      : undefined;
  }

  get eligibilityDate(): Date | undefined {
    return (
      this.record?.eligibleCriteria.usMoOverdueForHearing?.nextReviewDate ??
      this.record?.ineligibleCriteria.usMoOverdueForHearing?.nextReviewDate
    );
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (!this.record) return "Other";
    if (this.denied) return this.deniedTabTitle;
    if (this.record.eligibleCriteria.usMoOverdueForHearing)
      return "Overdue For Hearing";
    if (!this.record.ineligibleCriteria.usMoOverdueForHearing?.nextReviewDate)
      return "Missing Review Date";
    return "Upcoming Hearings";
  }

  showEligibilityStatus(component: Component): boolean {
    return this.reviewStatus === "DENIED" || component === "OpportunityCapsule";
  }
}
