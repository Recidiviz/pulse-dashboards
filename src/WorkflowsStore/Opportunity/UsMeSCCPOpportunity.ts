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

import { differenceInMonths } from "date-fns";
import { computed, makeObservable } from "mobx";

import { Resident } from "../Resident";
import { OTHER_KEY } from "../utils";
import { UsMeSCCPForm } from "./Forms/UsMeSCCPForm";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMeSCCPReferralRecord,
} from "./UsMeSCCPReferralRecord";

const DENIAL_REASONS_MAP = {
  "CASE PLAN": "Not compliant with case plan goals",
  PROGRAM: "Has not completed required core programming",
  DISCIPLINE:
    "Found guilty of a Class A or B disciplinary violation in the past 90 days " +
    "or has a Class A or B disciplinary violation pending",
  DECLINE: "Client declined opportunity to apply for SCCP",
  [OTHER_KEY]: "Other, please specify a reason",
};

const CRITERIA_COPY: Record<
  keyof UsMeSCCPReferralRecord["criteria"],
  Required<OpportunityRequirement>
> = {
  usMeMinimumOrCommunityCustody: {
    text: "Currently on $CUSTODY_LEVEL",
    tooltip: "Currently on minimum or community custody",
  },
  usMeServedXPortionOfSentence: {
    text: "Served at least $MINIMUM_FRACTION of sentence",
    tooltip:
      "Served at least $MINIMUM_FRACTION of the term of imprisonment imposed or, in the case of " +
      "a split sentence, at least 2/3 of the unsuspended portion, after consideration of any " +
      "deductions that the prisoner has received and retained under Title 17A, section 2302, " +
      "subsection 1; section 2305; section 2307; section 2308; section 2309; section 2310; or " +
      "section 2311 if the term of imprisonment or, in the case of a split sentence, the " +
      "unsuspended portion is $LENGTH_CONDITION.",
  },
  usMeXMonthsRemainingOnSentence: {
    text: "$MONTHS_REMAINING months remaining on sentence",
    tooltip:
      "No more than thirty (30) months remaining on the term of imprisonment or, " +
      "in the case of a split sentence, on the unsuspended portion, after consideration " +
      "of any deductions that the resident has received and retained under Title 17-A, " +
      "Sections 2302(1), 2305, and 23017-2311, if the commissioner, or designee, determines " +
      "that the average statewide case load is no more than ninety (90) adult community " +
      "corrections clients to one probation officer.",
  },
};

export class UsMeSCCPOpportunity extends OpportunityBase<
  Resident,
  UsMeSCCPReferralRecord
> {
  resident: Resident;

  form: UsMeSCCPForm;

  policyOrMethodologyUrl =
    "https://www.maine.gov/sos/cec/rules/03/201/c10s272.docx";

  constructor(resident: Resident) {
    super(resident, "usMeSCCP", resident.rootStore, transformReferral);
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;

    this.form = new UsMeSCCPForm("usMeSCCP", this, resident.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { criteria } = this.record;
    const requirements: OpportunityRequirement[] = [];

    const {
      usMeMinimumOrCommunityCustody,
      usMeServedXPortionOfSentence,
      usMeXMonthsRemainingOnSentence,
    } = CRITERIA_COPY;

    if (criteria.usMeMinimumOrCommunityCustody) {
      // TODO(#2708): Figure out when this is 1/2 and when this is 2/3
      usMeMinimumOrCommunityCustody.text = usMeMinimumOrCommunityCustody.text.replace(
        "$CUSTODY_LEVEL",
        criteria.usMeMinimumOrCommunityCustody.custodyLevel.toLowerCase()
      );
      requirements.push(usMeMinimumOrCommunityCustody);
    }
    if (criteria.usMeServedXPortionOfSentence?.eligibleDate <= new Date()) {
      const lengthCondition: "5 years or less" | "more than 5 years" =
        "5 years or less";
      const minimumFraction: "1/2" | "2/3" = "1/2";

      usMeServedXPortionOfSentence.text = usMeServedXPortionOfSentence.text.replace(
        "$MINIMUM_FRACTION",
        minimumFraction
      );
      usMeServedXPortionOfSentence.tooltip = usMeServedXPortionOfSentence.tooltip
        .replace("$MINIMUM_FRACTION", minimumFraction)
        .replace("$LENGTH_CONDITION", lengthCondition);
      requirements.push(usMeServedXPortionOfSentence);
    }

    if (criteria.usMeXMonthsRemainingOnSentence?.eligibleDate <= new Date()) {
      const monthsRemaining = this.resident.releaseDate
        ? differenceInMonths(this.resident.releaseDate, new Date())
        : "Under 36";

      usMeXMonthsRemainingOnSentence.text = usMeXMonthsRemainingOnSentence.text.replace(
        "$MONTHS_REMAINING",
        `${monthsRemaining}`
      );

      requirements.push(usMeXMonthsRemainingOnSentence);
    }

    return requirements;
  }
}
