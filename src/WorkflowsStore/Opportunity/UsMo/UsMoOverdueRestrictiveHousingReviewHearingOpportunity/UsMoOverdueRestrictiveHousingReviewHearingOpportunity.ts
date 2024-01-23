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
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  usMoInRestrictiveHousing,
  usMoNoActiveD1Sanctions,
  UsMoOverdueRestrictiveHousingBase,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import {
  UsMoOverdueRestrictiveHousingReviewHearingReferralRecord,
  usMoOverdueRestrictiveHousingReviewHearingSchema,
} from "./UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord> =
  {
    eligibleCriteria: [
      [
        "usMoPastLatestScheduledReviewDate",
        {
          text: "Past due date, or scheduled date, for review hearing",
        },
      ],
      usMoNoActiveD1Sanctions,
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [],
  };

export class UsMoOverdueRestrictiveHousingReviewHearingOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingReviewHearingReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

  resident: Resident;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingReviewHearing",
      usMoOverdueRestrictiveHousingReviewHearingSchema.parse
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
    return this.record?.eligibleCriteria.usMoPastLatestScheduledReviewDate
      ?.nextReviewDate;
  }

  get eligibleStatusMessage(): string {
    return this.generateUsMoOverdueEligibilityStatusMessage(
      "Status hearing",
      ""
    );
  }
}
