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

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { formatWorkflowsDate } from "../../utils";
import { Resident } from "../Resident";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMoRestrictiveHousingStatusHearingReferralRecord,
  validateReferral,
} from "./UsMoRestrictiveHousingStatusHearingReferralRecord";

const DENIAL_REASONS_MAP = {
  DATA: "Record of hearing in another file or table",
  [OTHER_KEY]: "Other, please specify a reason",
};

export class UsMoRestrictiveHousingStatusHearingOpportunity extends OpportunityBase<
  Resident,
  UsMoRestrictiveHousingStatusHearingReferralRecord
> {
  resident: Resident;

  readonly isAlert = true;

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MO;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoRestrictiveHousingStatusHearing",
      resident.rootStore,
      transformReferral,
      validateReferral
    );
    this.resident = resident;
    this.denialReasonsMap = DENIAL_REASONS_MAP;

    makeObservable(this, {
      requirementsMet: computed,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      criteria: { usMoHasUpcomingHearing },
    } = this.record;

    if (usMoHasUpcomingHearing.nextReviewDate) {
      const daysUntilNextReviewDate = differenceInDays(
        usMoHasUpcomingHearing.nextReviewDate,
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

      const text = `Next review date (${formatWorkflowsDate(
        usMoHasUpcomingHearing.nextReviewDate
      )}) is ${daysString}`;
      requirements.push({
        text,
      });
    }

    return requirements;
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.criteria.usMoHasUpcomingHearing.nextReviewDate;
  }
}
