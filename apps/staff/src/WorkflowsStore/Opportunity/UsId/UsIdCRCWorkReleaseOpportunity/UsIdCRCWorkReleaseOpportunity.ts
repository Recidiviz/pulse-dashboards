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

import { Resident } from "../../../Resident";
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
  UsIdCRCWorkReleaseReferralRecord,
  usIdCRCWorkReleaseSchema,
} from "./UsIdCRCWorkReleaseReferralRecord";

const COMMON_TEMPORAL_TOOLTIP = `The resident must fulfill one of the following three conditions:
    1. Tentative Parole Date (TPD) within seven (18) months OR
        Full Term Release Date (FTRD) within seven (18) months
    2. Early Release Date (EPRD) within 18 months AND
        Full Term Release Date (FTRD) within 15 years
    3. Life sentence AND
        Tentative Parole Date (TPD) within 1 year`;

const CRITERIA_COPY: CriteriaCopy<UsIdCRCWorkReleaseReferralRecord> = {
  eligibleCriteria: [
    custodyLevelIsMinimumCopy,
    notServingForSexualOffenseCopy,
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
    usIdNoDetainersForXcrcAndCrcCopy,
    [
      "usIdIncarcerationWithin18MonthsOfFtcdOrTpd",
      {
        text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
    [
      "usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd",
      {
        text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
    [
      "usIdIncarcerationWithin1YearOfTpdAndLifeSentence",
      {
        text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
        tooltip: COMMON_TEMPORAL_TOOLTIP,
      },
    ],
  ],
  ineligibleCriteria: [],
};

export class UsIdCRCWorkReleaseOpportunity extends UsIdCRCOpportunityBase<UsIdCRCWorkReleaseReferralRecord> {
  constructor(resident: Resident) {
    super(
      resident,
      "usIdCRCWorkRelease",
      resident.rootStore,
      usIdCRCWorkReleaseSchema.parse,
    );

    makeObservable(this, { requirementsMet: computed });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(this.record, "eligibleCriteria", CRITERIA_COPY);
  }
}
