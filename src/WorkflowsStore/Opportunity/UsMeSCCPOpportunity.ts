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

import { differenceInDays, differenceInMonths } from "date-fns";
import { cloneDeep } from "lodash";
import { computed, makeObservable, observable } from "mobx";

import { Resident } from "../Resident";
import { OTHER_KEY } from "../utils";
import { UsMeSCCPForm } from "./Forms/UsMeSCCPForm";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMeSCCPCriteria,
  UsMeSCCPReferralRecord,
} from "./UsMeSCCPReferralRecord";

const DENIAL_REASONS_MAP = {
  "CASE PLAN": "Not compliant with case plan goals",
  PROGRAM: "Has not completed required core programming",
  DISCIPLINE: "Has a Class A or B disciplinary violation pending",
  DECLINE: "Resident declined opportunity to apply for SCCP",
  [OTHER_KEY]: "Other, please specify a reason",
};

const ELIGIBLE_CRITERIA_COPY: Record<
  keyof UsMeSCCPCriteria,
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
      "a split sentence, at least $MINIMUM_FRACTION of the unsuspended portion, after consideration of any " +
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
  usMeNoClassAOrBViolationFor90Days: {
    text: "No Class A or B disciplines pending or occurring in the past 90 days",
    tooltip:
      "Must not have been found guilty of a Class A or B disciplinary violation within ninety " +
      "(90) days of submitting the plan to be transferred to supervised community confinement " +
      "or anytime thereafter prior to the scheduled transfer and must not have a Class A or B " +
      "disciplinary report pending at the time of submitting the plan or scheduled transfer.",
  },
  usMeNoDetainersWarrantsOrOther: {
    text: "No detainers, warrants, or other pending holds",
    tooltip:
      "Must have no detainers, warrants, or other pending holds preventing participation in a " +
      "community program as set out in Department Policy (AF) 23.1",
  },
};

const INELIGIBLE_CRITERIA_COPY = {
  usMeXMonthsRemainingOnSentence:
    ELIGIBLE_CRITERIA_COPY.usMeXMonthsRemainingOnSentence,
  usMeNoClassAOrBViolationFor90Days: {
    text: "Needs $DAYS_REMAINING more days without a Class A or B discipline",
    tooltip: ELIGIBLE_CRITERIA_COPY.usMeNoClassAOrBViolationFor90Days.tooltip,
  },
};

function hydrateXMonthsRemainingRequirement(
  criterion: UsMeSCCPCriteria["usMeXMonthsRemainingOnSentence"],
  copy: OpportunityRequirement
) {
  const monthsRemaining =
    differenceInMonths(criterion.eligibleDate, new Date()) + 30;

  return {
    text: copy.text.replace("$MONTHS_REMAINING", `${monthsRemaining}`),
    tooltip: copy.tooltip,
  };
}
function hydrateDaysWithoutViolationRequirementText(
  criterion: NonNullable<UsMeSCCPCriteria["usMeNoClassAOrBViolationFor90Days"]>
) {
  const daysRemaining = differenceInDays(
    criterion.eligibleDate,
    new Date()
  ).toString();

  return INELIGIBLE_CRITERIA_COPY.usMeNoClassAOrBViolationFor90Days.text.replace(
    "$DAYS_REMAINING",
    daysRemaining
  );
}

const requirementsForEligibleCriteria = (
  criteria: Partial<UsMeSCCPCriteria>
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];

  const {
    usMeMinimumOrCommunityCustody,
    usMeServedXPortionOfSentence,
    usMeXMonthsRemainingOnSentence,
    usMeNoDetainersWarrantsOrOther,
    usMeNoClassAOrBViolationFor90Days,
  } = cloneDeep(ELIGIBLE_CRITERIA_COPY);

  if (criteria.usMeMinimumOrCommunityCustody) {
    usMeMinimumOrCommunityCustody.text =
      usMeMinimumOrCommunityCustody.text.replace(
        "$CUSTODY_LEVEL",
        criteria.usMeMinimumOrCommunityCustody.custodyLevel.toLowerCase()
      );
    requirements.push(usMeMinimumOrCommunityCustody);
  }

  if (criteria.usMeServedXPortionOfSentence) {
    const { xPortionServed } = criteria.usMeServedXPortionOfSentence;
    const lengthCondition =
      xPortionServed === "1/2" ? "5 years or less" : "more than 5 years";

    usMeServedXPortionOfSentence.text =
      usMeServedXPortionOfSentence.text.replace(
        "$MINIMUM_FRACTION",
        xPortionServed
      );
    usMeServedXPortionOfSentence.tooltip = usMeServedXPortionOfSentence.tooltip
      .replaceAll("$MINIMUM_FRACTION", xPortionServed)
      .replace("$LENGTH_CONDITION", lengthCondition);
    requirements.push(usMeServedXPortionOfSentence);
  }

  if (criteria.usMeXMonthsRemainingOnSentence) {
    requirements.push(
      hydrateXMonthsRemainingRequirement(
        criteria.usMeXMonthsRemainingOnSentence,
        usMeXMonthsRemainingOnSentence
      )
    );
  }

  if (criteria.usMeNoDetainersWarrantsOrOther === null) {
    requirements.push(usMeNoDetainersWarrantsOrOther);
  }

  if (criteria.usMeNoClassAOrBViolationFor90Days === null) {
    requirements.push(usMeNoClassAOrBViolationFor90Days);
  }

  return requirements;
};

const requirementsForIneligibleCriteria = (
  criteria: Partial<UsMeSCCPCriteria>
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];

  const { usMeXMonthsRemainingOnSentence, usMeNoClassAOrBViolationFor90Days } =
    cloneDeep(INELIGIBLE_CRITERIA_COPY);

  if (criteria.usMeXMonthsRemainingOnSentence) {
    if (criteria.usMeXMonthsRemainingOnSentence) {
      requirements.push(
        hydrateXMonthsRemainingRequirement(
          criteria.usMeXMonthsRemainingOnSentence,
          usMeXMonthsRemainingOnSentence
        )
      );
    }
  }

  if (criteria.usMeNoClassAOrBViolationFor90Days) {
    requirements.push({
      text: hydrateDaysWithoutViolationRequirementText(
        criteria.usMeNoClassAOrBViolationFor90Days
      ),
      tooltip: usMeNoClassAOrBViolationFor90Days.tooltip,
    });
  }

  return requirements;
};

export class UsMeSCCPOpportunity extends OpportunityBase<
  Resident,
  UsMeSCCPReferralRecord
> {
  resident: Resident;

  form: UsMeSCCPForm;

  policyOrMethodologyUrl =
    "https://www.maine.gov/sos/cec/rules/03/201/c10s272.docx";

  almostEligibleRecommendedNote = undefined;

  constructor(resident: Resident) {
    super(resident, "usMeSCCP", resident.rootStore, transformReferral);
    this.resident = resident;

    makeObservable(this, {
      almostEligible: computed,
      almostEligibleRecommendedNote: observable,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;

    this.form = new UsMeSCCPForm("usMeSCCP", this, resident.rootStore);
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { eligibleCriteria } = this.record;
    return requirementsForEligibleCriteria(eligibleCriteria);
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { ineligibleCriteria } = this.record;
    return requirementsForIneligibleCriteria(ineligibleCriteria);
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible) return;
    const {
      usMeXMonthsRemainingOnSentence,
      usMeNoClassAOrBViolationFor90Days,
    } = this.record?.ineligibleCriteria ?? {};

    if (usMeXMonthsRemainingOnSentence) {
      const { eligibleDate } = usMeXMonthsRemainingOnSentence;

      const monthsRemaining = differenceInMonths(eligibleDate, new Date());
      let daysRemaining;
      if (monthsRemaining === 0) {
        daysRemaining = `and ${differenceInDays(
          eligibleDate,
          new Date()
        )} days `;
      }
      return `${monthsRemaining + 30} months ${
        daysRemaining || ""
      }until release`;
    }

    if (usMeNoClassAOrBViolationFor90Days) {
      return hydrateDaysWithoutViolationRequirementText(
        usMeNoClassAOrBViolationFor90Days
      );
    }

    return "Status unknown";
  }
}
