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

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityRequirement, OpportunityTab } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  usMoInRestrictiveHousing,
  usMoNoActiveD1Sanctions,
  UsMoOverdueRestrictiveHousingBase,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import {
  UsMoOverdueRestrictiveHousingInitialHearingReferralRecord,
  usMoOverdueRestrictiveHousingInitialHearingSchema,
} from "./UsMoOverdueRestrictiveHousingInitialHearingReferralRecord";

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord> =
  {
    eligibleCriteria: [
      [
        "usMoInitialHearingPastDueDate",
        {
          text: "Past due date, or scheduled date, for initial meaningful hearing",
        },
      ],
      [
        "usMoNoHearingOrNextReviewSinceRestrictiveHousingStart",
        {
          text: "Hasn't had a hearing since Restrictive Housing placement",
        },
      ],
      usMoNoActiveD1Sanctions,
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [],
  };

export class UsMoOverdueRestrictiveHousingInitialHearingOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingInitialHearingReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

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
    "NOT UP-TO-DATE": "Released this week",
    [OTHER_KEY]: "Other",
  };

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(this.record, "eligibleCriteria", CRITERIA_COPY);
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria.usMoInitialHearingPastDueDate
      .nextReviewDate;
  }

  get OpportunityTab(): OpportunityTab {
    if (this.denied) return this.deniedTabTitle;
    if (!this.eligibilityDate) return "Missing Review Date";
    return "Coming up";
  }

  get eligibleStatusMessage(): string {
    return super.generateUsMoOverdueEligibilityStatusMessage(
      "Initial hearing",
      ""
    );
  }
}
