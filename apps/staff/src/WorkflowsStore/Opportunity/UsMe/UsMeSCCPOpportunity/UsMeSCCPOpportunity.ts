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

import { differenceInDays, differenceInMonths } from "date-fns";
import { DocumentData } from "firebase/firestore";
import { cloneDeep } from "lodash";

import { UsMeSCCPCriteria, UsMeSCCPRecord, usMeSCCPSchema } from "~datatypes";

import { pluralizeWord } from "../../../../utils";
import { Resident } from "../../../Resident";
import { UsMeSCCPForm } from "../../Forms/UsMeSCCPForm";
import { OpportunityRequirement } from "../../types";
import { UsMeExternalSnoozeOpportunityBase } from "../UsMeExternalSnoozeOpportunityBase/UsMeExternalSnoozeOpportunityBase";

const ELIGIBLE_CRITERIA_COPY: Record<
  keyof UsMeSCCPCriteria,
  OpportunityRequirement
> = {
  usMeCustodyLevelIsMinimumOrCommunity: {
    text: "Currently on eligible custody level: $CUSTODY_LEVEL",
    tooltip: "Currently on minimum or community custody",
  },
  usMeServedXPortionOfSentence: {
    text: "Has served minimum required time on term: $SERVED_CONDITION $MINIMUM_FRACTION of sentence",
    tooltip:
      "Served at least $MINIMUM_FRACTION of the term of imprisonment imposed or, in the case of " +
      "a split sentence, at least $MINIMUM_FRACTION of the unsuspended portion, after consideration of any " +
      "deductions that the prisoner has received and retained under Title 17A, section 2302, " +
      "subsection 1; section 2305; section 2307; section 2308; section 2309; section 2310; or " +
      "section 2311 if the term of imprisonment or, in the case of a split sentence, the " +
      "unsuspended portion is $LENGTH_CONDITION.",
  },
  usMeXMonthsRemainingOnSentence: {
    text: "Has 30 or fewer months remaining on term: $MONTHS_REMAINING months remaining on sentence",
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
    // The violation text is an empty string but is always overwritten with a custom string based on
    // the presence of an eligibility date in hydrateDaysWithoutViolationRequirementText
    text: "",
    tooltip: ELIGIBLE_CRITERIA_COPY.usMeNoClassAOrBViolationFor90Days.tooltip,
  },
  usMeServedXPortionOfSentence: {
    text: "Currently $TIME_REMAINING $TIME_UNIT away from minimum time served requirement",
    tooltip: ELIGIBLE_CRITERIA_COPY.usMeServedXPortionOfSentence.tooltip,
  },
};

export function hydrateXMonthsRemainingRequirement(
  criterion: NonNullable<UsMeSCCPCriteria["usMeXMonthsRemainingOnSentence"]>,
  copy: OpportunityRequirement,
) {
  // this can only happen for fully ineligible residents.
  // the schema supports them but Workflows doesn't
  if (!criterion.eligibleDate) return;

  const monthsRemaining =
    differenceInMonths(criterion.eligibleDate, new Date()) + 36;

  const pluralizedMonth = monthsRemaining === 1 ? "month" : "months";

  return {
    text: copy.text.replace(
      "$MONTHS_REMAINING months",
      `${monthsRemaining} ${pluralizedMonth}`,
    ),
    tooltip: copy.tooltip,
  };
}

function hydrateServedXPortionOfSentence(
  criterion: NonNullable<UsMeSCCPCriteria["usMeServedXPortionOfSentence"]>,
  copy: OpportunityRequirement,
) {
  const { xPortionServed, eligibleDate } = criterion;
  // this can only happen for fully ineligible residents.
  // the schema supports them but Workflows doesn't
  if (!eligibleDate) return;

  const lengthCondition =
    xPortionServed === "1/2" ? "5 years or less" : "more than 5 years";
  const monthsDifference = differenceInMonths(new Date(), eligibleDate);
  const daysDifference = differenceInDays(new Date(), eligibleDate);

  const isDays = monthsDifference === 0;
  // the difference will be negative if the eligible date is in the future;
  // flip the sign to get the time remaining for display purposes
  const timeRemaining = -(isDays ? daysDifference : monthsDifference);
  const timeUnit = pluralizeWord({
    term: isDays ? "day" : "month",
    count: timeRemaining,
  });

  const servedCondition =
    monthsDifference >= -3 && monthsDifference < 0
      ? `Within ${-daysDifference} days of having served`
      : "Served at least";

  const text =
    copy.text &&
    copy.text
      .replace("$MINIMUM_FRACTION", xPortionServed)
      .replace("$TIME_UNIT", timeUnit)
      .replace("$TIME_REMAINING", `${timeRemaining}`)
      .replace("$SERVED_CONDITION", servedCondition);
  const tooltip =
    copy.tooltip &&
    copy.tooltip
      .replaceAll("$MINIMUM_FRACTION", xPortionServed)
      .replace("$LENGTH_CONDITION", lengthCondition);

  return { text, tooltip };
}

function hydrateDaysWithoutViolationRequirementText(
  criterion: NonNullable<UsMeSCCPCriteria["usMeNoClassAOrBViolationFor90Days"]>,
) {
  if (criterion.eligibleDate) {
    const daysRemaining = differenceInDays(
      criterion.eligibleDate,
      new Date(),
    ).toString();
    return `Needs ${daysRemaining} more days without a Class A or B discipline`;
  }

  return `Class ${criterion.highestClassViol} violation: ${criterion.violType}`;
}

const requirementsForEligibleCriteria = (
  criteria: UsMeSCCPRecord["output"]["eligibleCriteria"],
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];

  const {
    usMeCustodyLevelIsMinimumOrCommunity,
    usMeServedXPortionOfSentence,
    usMeXMonthsRemainingOnSentence,
    usMeNoDetainersWarrantsOrOther,
    usMeNoClassAOrBViolationFor90Days,
  } = cloneDeep(ELIGIBLE_CRITERIA_COPY);

  if (criteria.usMeCustodyLevelIsMinimumOrCommunity) {
    usMeCustodyLevelIsMinimumOrCommunity.text =
      usMeCustodyLevelIsMinimumOrCommunity.text.replace(
        "$CUSTODY_LEVEL",
        criteria.usMeCustodyLevelIsMinimumOrCommunity.custodyLevel.toLowerCase(),
      );
    requirements.push(usMeCustodyLevelIsMinimumOrCommunity);
  }

  if (criteria.usMeXMonthsRemainingOnSentence) {
    requirements.push(
      // this can be missing if the criterion was missing some data,
      // which does not apply to eligible residents per the schema
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      hydrateXMonthsRemainingRequirement(
        criteria.usMeXMonthsRemainingOnSentence,
        usMeXMonthsRemainingOnSentence,
      )!,
    );
  }

  if (criteria.usMeServedXPortionOfSentence) {
    requirements.push(
      // this can be missing if the criterion was missing some data,
      // which does not apply to eligible residents per the schema
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      hydrateServedXPortionOfSentence(
        criteria.usMeServedXPortionOfSentence,
        usMeServedXPortionOfSentence,
      )!,
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
  criteria: Partial<UsMeSCCPCriteria>,
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];

  const {
    usMeXMonthsRemainingOnSentence,
    usMeNoClassAOrBViolationFor90Days,
    usMeServedXPortionOfSentence,
  } = cloneDeep(INELIGIBLE_CRITERIA_COPY);

  if (criteria.usMeXMonthsRemainingOnSentence) {
    const requirement = hydrateXMonthsRemainingRequirement(
      criteria.usMeXMonthsRemainingOnSentence,
      usMeXMonthsRemainingOnSentence,
    );
    // this can be missing if the criterion was missing some data.
    // should only happen with fully ineligible residents, who will not be displayed anyway,
    // so it should be safe to ignore these cases in practice
    if (requirement) {
      requirements.push(requirement);
    }
  }

  if (criteria.usMeServedXPortionOfSentence) {
    const requirement = hydrateServedXPortionOfSentence(
      criteria.usMeServedXPortionOfSentence,
      usMeServedXPortionOfSentence,
    );
    // this can be missing if the criterion was missing some data.
    // only happens with fully ineligible residents, who will not be displayed anyway,
    // so it should be safe to ignore these cases in practice
    if (requirement) {
      requirements.push(requirement);
    }
  }

  if (criteria.usMeNoClassAOrBViolationFor90Days) {
    requirements.push({
      text: hydrateDaysWithoutViolationRequirementText(
        criteria.usMeNoClassAOrBViolationFor90Days,
      ),
      tooltip: usMeNoClassAOrBViolationFor90Days.tooltip,
    });
  }

  return requirements;
};

export class UsMeSCCPOpportunity extends UsMeExternalSnoozeOpportunityBase<
  Resident,
  UsMeSCCPRecord["output"]
> {
  form: UsMeSCCPForm;

  readonly portionServedRequirement = ["1/2", "2/3"];

  almostEligibleRecommendedNote = undefined;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMeSCCP",
      resident.rootStore,
      usMeSCCPSchema.parse(record),
    );

    this.form = new UsMeSCCPForm(this, resident.rootStore);
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
      usMeServedXPortionOfSentence,
    } = this.record?.ineligibleCriteria ?? {};

    if (usMeXMonthsRemainingOnSentence) {
      const { eligibleDate } = usMeXMonthsRemainingOnSentence;
      // this should never be missing in almost-eligible residents.
      // only expected for fully ineligible residents, who are not supported here anyway
      if (!eligibleDate) return;

      const monthsRemaining = differenceInMonths(eligibleDate, new Date());
      let remainingText =
        monthsRemaining === 1
          ? `${monthsRemaining} month`
          : `${monthsRemaining} months`;
      if (monthsRemaining === 0) {
        const daysRemaining = differenceInDays(eligibleDate, new Date());
        remainingText =
          daysRemaining === 1
            ? `${daysRemaining} day`
            : `${daysRemaining} days`;
      }
      return `Will reach 30 months or fewer remaining on term in ${remainingText}`;
    }

    if (usMeNoClassAOrBViolationFor90Days) {
      return hydrateDaysWithoutViolationRequirementText(
        usMeNoClassAOrBViolationFor90Days,
      );
    }

    if (usMeServedXPortionOfSentence) {
      const { usMeServedXPortionOfSentence: copy } = cloneDeep(
        INELIGIBLE_CRITERIA_COPY,
      );

      // this can be missing if the criterion was missing some data.
      // only happens with fully ineligible residents, who are not supported anyway
      return hydrateServedXPortionOfSentence(usMeServedXPortionOfSentence, copy)
        ?.text;
    }

    return "Status unknown";
  }
}
