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

import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils/criteriaUtils";
import { UsIdCRCOpportunityBase } from "../UsIdCRCOpportunityBase";
import {
  custodyLevelIsMinimumCopy,
  notServingForSexualOffenseCopy,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
  usIdNoDetainersForXcrcAndCrcCopy,
} from "../UsIdSharedCriteria";
import {
  UsIdCRCResidentWorkerReferralRecord,
  usIdCRCResidentWorkerSchema,
} from "./UsIdCRCResidentWorkerReferralRecord";

const COMMON_TEMPORAL_TOOLTIP = `The resident must fulfill one of the following three conditions:
    1. Tentative Parole Date (TPD) within seven (7) years OR
        Full Term Release Date (FTRD) within seven (7) years
    2. Parole Eligibility Date (PED) within seven (7) years AND
        Parole Hearing Date (PHD) within seven (7) years AND
        Full Term Release Date (FTRD) within 20 years
    3. Life sentence AND
        Tentative Parole Date (TPD) within 3 years`;

const CRITERIA_COPY: CriteriaCopy<UsIdCRCResidentWorkerReferralRecord> = {
  eligibleCriteria: [
    custodyLevelIsMinimumCopy,
    notServingForSexualOffenseCopy,
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
    usIdNoDetainersForXcrcAndCrcCopy,
    [
      "usIdIncarcerationWithin7YearsOfFtcdOrTpd",
      {
        text:
          "Tentative Parole Date (TPD) within seven (7) years OR Full Term Release Date " +
          "(FTRD) within seven (7) years",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
    [
      "usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd",
      {
        text:
          "Parole Eligibility Date (PED) within seven (7) years AND Parole Hearing Date (PHD) " +
          "within seven (7) years AND Full Term Release Date (FTRD) within 20 years",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
    [
      "usIdIncarcerationWithin3YearsOfTpdAndLifeSentence",
      {
        text: "Life sentence AND Tentative Parole Date (TPD) within 3 years",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
  ],
  ineligibleCriteria: [],
};

const DENIAL_REASONS_MAP = {
  MEDICAL: "Was not approved by an IDOC medical provider",
  PENDING:
    "There are pending felony charges or felony investigations in which the resident is a suspect",
  BEHAVIOR: "Resident has had poor institutional behavior",
  PROGRAM: "Missing required facility programming",
  [OTHER_KEY]: "Other, please specify a reason",
};

export class UsIdCRCResidentWorkerOpportunity extends UsIdCRCOpportunityBase<UsIdCRCResidentWorkerReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "UsIdPastTwoYearsAlert",
    "CaseNotes",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ID;

  denialReasonsMap = DENIAL_REASONS_MAP;

  constructor(resident: Resident) {
    super(
      resident,
      "usIdCRCResidentWorker",
      resident.rootStore,
      usIdCRCResidentWorkerSchema.parse,
    );

    makeObservable(this, { requirementsMet: computed });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(this.record, "eligibleCriteria", CRITERIA_COPY);
  }
}
