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

import { differenceInDays } from "date-fns";
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { formatWorkflowsDate } from "../../utils";
import { Resident } from "../Resident";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMoRestrictiveHousingStatusHearingReferralRecord,
} from "./UsMoRestrictiveHousingStatusHearingReferralRecord";

export class UsMoRestrictiveHousingStatusHearingOpportunity extends OpportunityBase<
  Resident,
  UsMoRestrictiveHousingStatusHearingReferralRecord
> {
  resident: Resident;

  readonly isAlert = true;

  // TODO(#3053): Add Workflows methodology for US_MO
  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ME;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoRestrictiveHousingStatusHearing",
      resident.rootStore,
      transformReferral
    );
    this.resident = resident;

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
      const daysTillNextReviewDate = differenceInDays(
        usMoHasUpcomingHearing.nextReviewDate,
        new Date()
      );
      const text = `${daysTillNextReviewDate} days until next review date (${formatWorkflowsDate(
        usMoHasUpcomingHearing.nextReviewDate
      )})`;
      // TODO(#3053): Add Workflows methodology for US_MO
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
