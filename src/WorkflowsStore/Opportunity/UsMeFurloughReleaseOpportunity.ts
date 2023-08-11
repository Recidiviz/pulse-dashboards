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
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { Resident } from "../Resident";
import { OTHER_KEY } from "../utils";
import { UsMeFurloughReleaseForm } from "./Forms/UsMeFurloughReleaseForm";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  UsMeFurloughReleaseReferralRecord,
  usMeFurloughReleaseSchema,
} from "./UsMeFurloughReleaseReferralRecord";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "./utils";

const DENIAL_REASONS_MAP = {
  "CASE PLAN": "Not compliant with case plan goals",
  PROGRAM: "Has not completed required core programming",
  DISCIPLINE: "Has a Class A or B disciplinary violation pending",
  DECLINE: "Resident declined opportunity to apply for SCCP",
  [OTHER_KEY]: "Other, please specify a reason",
};

const CRITERIA_COPY: CriteriaCopy<UsMeFurloughReleaseReferralRecord> = {
  eligibleCriteria: [
    [
      "usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease",
      {
        text: "Served at least 30 days at current facility",
        tooltip:
          "Served at least thirty (30) days of the term of imprisonment in the facility providing the furlough program",
      },
    ],
    [
      "usMeCustodyLevelIsMinimumOrCommunity",
      {
        text: "Currently on $CUSTODY_LEVEL",
        tooltip: "Currently on minimum or community custody",
      },
    ],
    [
      "usMeThreeYearsRemainingOnSentence",
      {
        text: "$MONTHS_REMAINING months remaining on sentence",
        tooltip:
          "No more than three (3) years remaining on the term(s) of imprisonment or, in the " +
          "case of a split sentence, on the unsuspended portion, after consideration of any " +
          "deductions that the resident has received and retained under Title 17-A, Sections " +
          "2302(1), 2305, and 2307 to 2311 (i.e., first day on a furlough must be no more than " +
          "three (3) years prior to the resident’s current custody release date).",
      },
    ],
    [
      "usMeNoClassAOrBViolationFor90Days",
      {
        text: "No Class A or B disciplines pending or occurring in the past 90 days",
        tooltip:
          "Must not have been found guilty of a Class A or B disciplinary violation within ninety " +
          "(90) days of submitting the plan to be transferred to supervised community confinement " +
          "or anytime thereafter prior to the scheduled transfer and must not have a Class A or B " +
          "disciplinary report pending at the time of submitting the plan or scheduled transfer.",
      },
    ],
    [
      "usMeNoDetainersWarrantsOrOther",
      {
        text: "No detainers, warrants, or other pending holds",
        tooltip:
          "Must have no detainers, warrants, or other pending holds preventing participation in a " +
          "community program as set out in Department Policy (AF) 23.1",
      },
    ],
    [
      "usMeServedHalfOfSentence",
      {
        text: "Served at least 1/2 of sentence",
        tooltip:
          "The resident must have served at least 1/2 of the term of imprisonment imposed or, in the " +
          " case of a split sentence, at least 1/2 of the unsuspended portion, after consideration of " +
          " any deductions that the resident has received and retained under Title 17-A, Sections " +
          "2302(1), 2305, and 2307 to 2311.\n \nA resident who is serving concurrent sentences must have " +
          "served 1/2 of the term of imprisonment imposed or, in the case of a split sentence, of the " +
          "unsuspended portion, on the controlling sentence, after consideration of any deductions that the " +
          "resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311.\n\n" +
          "A resident who is serving consecutive or nonconcurrent sentences must have served 1/2 of the " +
          "imprisonment time to be served on the combined sentences, after consideration of any deductions " +
          "that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to " +
          "2311. Depending on the length of the sentences and the deductions received and retained, a resident " +
          "may become eligible for a furlough to visit with family during any of the sentences.",
      },
    ],
  ],
  ineligibleCriteria: [],
};

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMeFurloughReleaseReferralRecord> =
  {
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: {
        CUSTODY_LEVEL: ({ custodyLevel }) => custodyLevel.toLowerCase(),
      },
      usMeThreeYearsRemainingOnSentence: {
        MONTHS_REMAINING: ({ eligibleDate }) => {
          const monthsRemaining =
            differenceInMonths(eligibleDate, new Date()) + 36;
          return `${monthsRemaining}`;
        },
      },
    },
  } as const;

export class UsMeFurloughReleaseOpportunity extends OpportunityBase<
  Resident,
  UsMeFurloughReleaseReferralRecord
> {
  resident: Resident;

  policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ME;

  form: UsMeFurloughReleaseForm;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "CaseNotes",
  ];

  constructor(resident: Resident) {
    super(
      resident,
      "usMeFurloughRelease",
      resident.rootStore,
      usMeFurloughReleaseSchema.parse
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;

    this.form = new UsMeFurloughReleaseForm(this, resident.rootStore);
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }
}
