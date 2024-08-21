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

import { computed, makeObservable, override } from "mobx";

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OpportunityRequirement } from "../../types";
import {
  CopyTuple,
  CriteriaCopy,
  CriteriaFormatters,
  hydrateCriteria,
} from "../../utils";
import {
  US_MO_DAYS_PAST,
  usMoInRestrictiveHousing,
  usMoNoActiveD1Sanctions,
  UsMoOverdueRestrictiveHousingBase,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import {
  UsMoOverdueRestrictiveHousingReviewHearingReferralRecord,
  usMoOverdueRestrictiveHousingReviewHearingSchema,
} from "./UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";

const usMoPastLatestScheduledReviewDateCopy: CopyTuple<"usMoPastLatestScheduledReviewDate"> =
  [
    "usMoPastLatestScheduledReviewDate",
    {
      text: "Status hearing due $DAYS_PAST ($DATE)",
      tooltip:
        "If the meaningful hearing is scheduled, the due date is the scheduled date. If NOT scheduled, the due date is 30 calendar days after the previous meaningful hearing or the date of assignment.",
    },
  ];

const usMoPastLatestScheduledReviewDateCriteriaFormatter: NonNullable<
  CriteriaFormatters<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord>[
    | "eligibleCriteria"
    | "ineligibleCriteria"]
>["usMoPastLatestScheduledReviewDate"] = {
  DAYS_PAST: (usMoPastLatestScheduledReviewDate) =>
    !usMoPastLatestScheduledReviewDate
      ? "date is unavailable"
      : US_MO_DAYS_PAST(usMoPastLatestScheduledReviewDate.nextReviewDate),
  DATE: (usMoPastLatestScheduledReviewDate) =>
    !usMoPastLatestScheduledReviewDate
      ? "N/A"
      : formatWorkflowsDate(usMoPastLatestScheduledReviewDate.nextReviewDate),
};

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord> =
  {
    eligibleCriteria: [
      usMoPastLatestScheduledReviewDateCopy,
      usMoNoActiveD1Sanctions,
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [usMoPastLatestScheduledReviewDateCopy],
  };

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord> =
  {
    eligibleCriteria: {
      usMoPastLatestScheduledReviewDate:
        usMoPastLatestScheduledReviewDateCriteriaFormatter,
    },
    ineligibleCriteria: {
      usMoPastLatestScheduledReviewDate:
        usMoPastLatestScheduledReviewDateCriteriaFormatter,
    },
  };

export class UsMoOverdueRestrictiveHousingReviewHearingOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord> {
  constructor(resident: Resident) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingReviewHearing",
      usMoOverdueRestrictiveHousingReviewHearingSchema.parse,
    );

    makeObservable(this, {
      requirementsMet: override,
      requirementsAlmostMet: override,
      eligibilityDate: computed,
      eligibleStatusMessage: computed,
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

  get eligibilityDate(): Date | undefined {
    const pastLatestScheduledReviewDate =
      this.record?.eligibleCriteria.usMoPastLatestScheduledReviewDate ||
      this.record?.ineligibleCriteria.usMoPastLatestScheduledReviewDate;
    const { nextReviewDate } = pastLatestScheduledReviewDate ?? {};

    return nextReviewDate;
  }

  get eligibleStatusMessage(): string {
    return this.generateUsMoOverdueEligibilityStatusMessage(
      "Status hearing due",
      "",
    );
  }
}
