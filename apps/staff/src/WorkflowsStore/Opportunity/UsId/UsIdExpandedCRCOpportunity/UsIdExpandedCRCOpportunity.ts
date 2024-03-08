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

import { makeObservable, override } from "mobx";

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OpportunityRequirement } from "../../types";
import {
  CriteriaCopy,
  CriteriaFormatters,
  hydrateCriteria,
} from "../../utils/criteriaUtils";
import { UsIdCRCOpportunityBase } from "../UsIdCRCOpportunityBase";
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

export class UsIdExpandedCRCOpportunity extends UsIdCRCOpportunityBase<UsIdExpandedCRCReferralRecord> {
  constructor(resident: Resident) {
    super(
      resident,
      "usIdExpandedCRC",
      resident.rootStore,
      usIdExpandedCRCSchema.parse,
    );

    makeObservable(this, { requirementsMet: override });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS,
    );
  }
}
