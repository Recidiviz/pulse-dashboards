// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { z } from "zod";

import { usMoWorkReleaseSchema } from "../../src/WorkflowsStore/Opportunity/UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseReferralRecord";
import { externalIdFunc, FirestoreFixture } from "./utils";

export type UsMoOutsideClearanceReferralRecordRaw = z.input<
  typeof usMoWorkReleaseSchema
>;

const data: UsMoOutsideClearanceReferralRecordRaw[] = [
  {
    stateCode: "US_MO",
    externalId: "RES019",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      incarcerationWithin60MonthsOfProjectedFullTermCompletionDateMin: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [],
      historyViolationsLast24Months: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_MO",
    externalId: "RES020",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      incarcerationWithin60MonthsOfProjectedFullTermCompletionDateMin: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [],
      historyViolationsLast24Months: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_MO",
    externalId: "RES021",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      incarcerationWithin60MonthsOfProjectedFullTermCompletionDateMin: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [],
      historyViolationsLast24Months: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_MO",
    externalId: "RES022",
    eligibleCriteria: {
      usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
      usMoInstitutionalRiskScore1WhileIncarcerated: {},
      incarcerationWithin60MonthsOfProjectedFullTermCompletionDateMin: {},
      usMoNoEscapeIn10YearsOrCurrentSentence: {},
      noContrabandIncarcerationIncidentWithin2Years: {},
    },
    ineligibleCriteria: {},
    formInformation: {
      historyEscapesAbsconsions: [],
      historyViolationsLast24Months: [],
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  },
];

export const usMoOutsideClearanceReferrals: FirestoreFixture<UsMoOutsideClearanceReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
