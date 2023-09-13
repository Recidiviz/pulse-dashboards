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
import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "../../utils";
import {
  notServingForSexualOffenseCopy,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
  usIdNoDetainersForXcrcAndCrcCopy,
} from "../UsIdSharedCriteria";
import {
  UsIdExpandedCRCReferralRecord,
  usIdExpandedCRCSchema,
} from "./UsIdExpandedCRCReferralRecord";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsIdExpandedCRCReferralRecord> = {
  eligibleCriteria: {
    usIdInCrcFacilityOrPwccUnit1: {
      START_DATE: ({ crcStartDate }) => formatWorkflowsDate(crcStartDate),
    },
  },
} as const;

const CRITERIA_COPY: CriteriaCopy<UsIdExpandedCRCReferralRecord> = {
  eligibleCriteria: [
    [
      "custodyLevelIsMinimum",
      {
        text: "Currently on Minimum custody",
        tooltip:
          "Shall be institutionally classified as minimum custody and cannot receive a classification override",
      },
    ],
    notServingForSexualOffenseCopy,
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
    usIdNoDetainersForXcrcAndCrcCopy,
    [
      "usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd",
      {
        text: "Is within 6 months of release",
        tooltip:
          "Shall be within six months of release (generally calculated from the parole eligibility date, " +
          "full-term release, or tentative parole date). Those who are past their parole eligibility date " +
          "or within six months of a tentative parole date may also be considered, on a case by case basis",
      },
    ],
    [
      "usIdInCrcFacilityOrPwccUnit1For60Days",
      {
        text: "Served at least 60 days at current facility",
        tooltip:
          "Shall have resided in a CRC or minimum custody employment release program " +
          "(such as PWCC’s Unit 1) for a minimum of 60 days",
      },
    ],
    [
      "usIdInCrcFacilityOrPwccUnit1",
      {
        text: "Resident in $FACILITY_NAME since $START_DATE",
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
  TRUST: "Resident does not have $500.00 in their resident trust account",
  EMPLOYMENT:
    "Resident is not currently employed full-time or engaged in or accepted to a full-time " +
    "Idaho educational program approved by the IDOC",
  CLASS_A_OR_B: "Has class A or B disciplinary reports in the past six months",
  [OTHER_KEY]: "Other, please specify a reason",
};

export class UsIdExpandedCRCOpportunity extends OpportunityBase<
  Resident,
  UsIdExpandedCRCReferralRecord
> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "CaseNotes",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ID;

  denialReasonsMap = DENIAL_REASONS_MAP;

  constructor(resident: Resident) {
    super(
      resident,
      "usIdExpandedCRC",
      resident.rootStore,
      usIdExpandedCRCSchema.parse
    );

    makeObservable(this, { requirementsMet: computed });
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
