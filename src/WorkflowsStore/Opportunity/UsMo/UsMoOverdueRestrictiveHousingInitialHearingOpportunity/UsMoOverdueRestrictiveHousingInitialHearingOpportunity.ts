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

import { makeObservable, override } from "mobx";

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
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
  UsMoOverdueRestrictiveHousingInitialHearingReferralRecord,
  usMoOverdueRestrictiveHousingInitialHearingSchema,
} from "./UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";

const usMoInitialHearingPastDueDateCopy: CopyTuple<"usMoInitialHearingPastDueDate"> =
  [
    "usMoInitialHearingPastDueDate",
    {
      text: "Initial meaningful hearing due $DAYS_PAST ($DATE)",
      tooltip:
        "If the hearing is scheduled in ITSC, the due date is the scheduled date. If NOT scheduled in ITSC, the due date is seven (7) business days after the initial assignment.",
    },
  ];

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord> =
  {
    eligibleCriteria: [
      usMoInitialHearingPastDueDateCopy,
      usMoNoActiveD1Sanctions,
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [usMoInitialHearingPastDueDateCopy],
  };

const usMoInitialHearingPastDueDateCriteriaFormatter: NonNullable<
  CriteriaFormatters<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord>[
    | "eligibleCriteria"
    | "ineligibleCriteria"]
>["usMoInitialHearingPastDueDate"] = {
  DAYS_PAST: ({ nextReviewDate }) => US_MO_DAYS_PAST(nextReviewDate),
  DATE: ({ nextReviewDate }) => formatWorkflowsDate(nextReviewDate),
};

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord> =
  {
    eligibleCriteria: {
      usMoInitialHearingPastDueDate:
        usMoInitialHearingPastDueDateCriteriaFormatter,
    },
    ineligibleCriteria: {
      usMoInitialHearingPastDueDate:
        usMoInitialHearingPastDueDateCriteriaFormatter,
    },
  };

export class UsMoOverdueRestrictiveHousingInitialHearingOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord> {
  resident: Resident;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingInitialHearing",
      usMoOverdueRestrictiveHousingInitialHearingSchema.parse
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: override,
    });
  }

  denialReasonsMap = {
    OUTDATED: "Hearing occurred this weeK",
    [OTHER_KEY]: "Other",
  };

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

  get eligibilityDate(): Date | undefined {
    const initialHearingPastDueDate =
      this.record?.eligibleCriteria.usMoInitialHearingPastDueDate ||
      this.record?.ineligibleCriteria.usMoInitialHearingPastDueDate;
    return initialHearingPastDueDate?.nextReviewDate;
  }

  get eligibleStatusMessage(): string {
    return super.generateUsMoOverdueEligibilityStatusMessage(
      "Initial hearing",
      "due"
    );
  }
}
