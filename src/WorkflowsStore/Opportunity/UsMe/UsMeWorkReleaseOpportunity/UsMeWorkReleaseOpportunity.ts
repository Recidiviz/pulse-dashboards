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

import { differenceInMonths } from "date-fns";
import { cloneDeep } from "lodash";
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { UsMeWorkReleaseForm } from "../../Forms/UsMeWorkReleaseForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  transformWorkReleaseReferral as transformReferral,
  UsMeWorkReleaseCriteria,
  UsMeWorkReleaseReferralRecord,
} from "./UsMeWorkReleaseReferralRecord";

const DENIAL_REASONS_MAP = {
  "CASE PLAN": "Not compliant with case plan goals",
  PROGRAM: "Has not completed required core programming",
  DISCIPLINE: "Has a Class A or B disciplinary violation pending",
  DECLINE: "Resident declined opportunity to apply for Work Release",
  [OTHER_KEY]: "Other, please specify a reason",
};

const ELIGIBLE_CRITERIA_COPY: Record<
  keyof UsMeWorkReleaseCriteria,
  Required<OpportunityRequirement>
> = {
  usMeCustodyLevelIsMinimum: {
    text: "Currently on minimum",
    tooltip: "Currently on minimum custody",
  },
  usMeThreeYearsRemainingOnSentence: {
    text: "$MONTHS_REMAINING months remaining on sentence",
    tooltip:
      "No more than three (3) years remaining on the term(s) of imprisonment or, in the " +
      "case of a split sentence, on the unsuspended portion, after consideration of any " +
      "deductions that the resident has received and retained under Title 17-A, Sections " +
      "2302(1), 2305, and 2307 to 2311 (i.e., first day at the community transition site " +
      "must be no more than three (3) years prior to the resident’s current custody release " +
      "date).",
  },
  usMeNoDetainersWarrantsOrOther: {
    text: "No detainers, warrants, or other pending holds",
    tooltip:
      "Must have no detainers, warrants, or other pending holds preventing participation " +
      "in a community program as set out in Department Policy (AF) 23.1, Classification " +
      "System.",
  },
  usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
    text: "Served at least 30 days at current facility",
    tooltip:
      "Served at least thirty (30) days of the term of imprisonment in " +
      "the facility providing the community transition program",
  },
  usMeNoClassAOrBViolationFor90Days: {
    text: "No Class A or B disciplines pending or occurring in the past 90 days",
    tooltip:
      "The resident must not have been found guilty of a Class A or B disciplinary violation " +
      "within ninety (90) days of submitting the application to participate in the community " +
      "transition program or anytime thereafter prior to the scheduled first day at the site " +
      "and must not have a Class A or B disciplinary report pending at the time of submitting " +
      "the application or scheduled first day at the site.",
  },
};

function hydrateThreeYearsRemainingRequirement(
  criterion: NonNullable<
    UsMeWorkReleaseCriteria["usMeThreeYearsRemainingOnSentence"]
  >,
  copy: OpportunityRequirement
) {
  const monthsRemaining =
    differenceInMonths(criterion.eligibleDate, new Date()) + 36;

  return {
    text: copy.text.replace("$MONTHS_REMAINING", `${monthsRemaining}`),
    tooltip: copy.tooltip,
  };
}

const requirementsForEligibleCriteria = (
  criteria: Partial<UsMeWorkReleaseCriteria>
): OpportunityRequirement[] => {
  const requirements: OpportunityRequirement[] = [];

  const {
    usMeCustodyLevelIsMinimum,
    usMeThreeYearsRemainingOnSentence,
    usMeNoDetainersWarrantsOrOther,
    usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease,
    usMeNoClassAOrBViolationFor90Days,
  } = cloneDeep(ELIGIBLE_CRITERIA_COPY);

  if (criteria.usMeCustodyLevelIsMinimum) {
    requirements.push(usMeCustodyLevelIsMinimum);
  }

  if (criteria.usMeThreeYearsRemainingOnSentence) {
    requirements.push(
      hydrateThreeYearsRemainingRequirement(
        criteria.usMeThreeYearsRemainingOnSentence,
        usMeThreeYearsRemainingOnSentence
      )
    );
  }

  if (criteria.usMeNoDetainersWarrantsOrOther === null) {
    requirements.push(usMeNoDetainersWarrantsOrOther);
  }

  if (criteria.usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease) {
    requirements.push(
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease
    );
  }

  if (criteria.usMeNoClassAOrBViolationFor90Days === null) {
    requirements.push(usMeNoClassAOrBViolationFor90Days);
  }

  return requirements;
};

export class UsMeWorkReleaseOpportunity extends OpportunityBase<
  Resident,
  UsMeWorkReleaseReferralRecord
> {
  resident: Resident;

  form: UsMeWorkReleaseForm;

  policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ME;

  readonly hideUnknownCaseNoteDates = true;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "CaseNotes",
  ];

  constructor(resident: Resident) {
    super(resident, "usMeWorkRelease", resident.rootStore, transformReferral);
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;

    this.form = new UsMeWorkReleaseForm(this, resident.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const { eligibleCriteria } = this.record;
    return requirementsForEligibleCriteria(eligibleCriteria);
  }
}
