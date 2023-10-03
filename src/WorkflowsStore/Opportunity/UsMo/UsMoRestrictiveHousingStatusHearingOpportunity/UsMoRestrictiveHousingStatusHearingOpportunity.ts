// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { Component, OpportunityRequirement, OpportunityTab } from "../../types";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "../../utils";
import {
  UsMoRestrictiveHousingStatusHearingReferralRecord,
  usMoRestrictiveHousingStatusHearingSchema,
  validateReferral,
} from "./UsMoRestrictiveHousingStatusHearingReferralRecord";

const DENIAL_REASONS_MAP = {
  COMP: "Hearing Completed",
  [OTHER_KEY]: "Other, please specify a reason",
};

const daysUntilNextReviewDateString = (nextReviewDate: Date) => {
  const daysUntilNextReviewDate = differenceInDays(
    nextReviewDate,
    // startOfToday is important here because eligibility dates don't have times, so they're
    // parsed as midnight. differenceInDays rounds down, so we need to compare with today's
    // midnight so we don't end up off by one.
    startOfToday()
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
                criteria.nextReviewDate
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
            criteria.nextReviewDate
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
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

  resident: Resident;

  readonly isAlert = true;

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MO;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoRestrictiveHousingStatusHearing",
      resident.rootStore,
      usMoRestrictiveHousingStatusHearingSchema.parse,
      validateReferral
    );
    this.resident = resident;
    this.denialReasonsMap = DENIAL_REASONS_MAP;

    makeObservable(this, {
      requirementsMet: computed,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "ineligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get eligibleStatusMessage(): string | undefined {
    return this.record?.eligibleCriteria.usMoOverdueForHearing
      ? CRITERIA_FORMATTERS.eligibleCriteria?.usMoOverdueForHearing?.REVIEW_DATE(
          this.record.eligibleCriteria.usMoOverdueForHearing,
          this.record
        )
      : undefined;
  }

  get almostEligibleStatusMessage(): string | undefined {
    return this.record?.ineligibleCriteria.usMoOverdueForHearing &&
      this.almostEligible
      ? CRITERIA_FORMATTERS.ineligibleCriteria?.usMoOverdueForHearing?.UPCOMING_OR_EMPTY_SHORT_TEXT(
          this.record.ineligibleCriteria.usMoOverdueForHearing,
          this.record
        )
      : undefined;
  }

  get eligibilityDate(): Date | undefined {
    return (
      this.record?.eligibleCriteria.usMoOverdueForHearing?.nextReviewDate ??
      this.record?.ineligibleCriteria.usMoOverdueForHearing?.nextReviewDate
    );
  }

  get tabTitle(): OpportunityTab {
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
