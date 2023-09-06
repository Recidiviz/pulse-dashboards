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
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  custodyLevelIsMinimumCopy,
  notServingForSexualOffenseCopy,
  usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
  usIdNoDetainersForCrcCopy,
} from "../UsIdSharedCriteria";
import {
  UsIdCRCWorkReleaseReferralRecord,
  usIdCRCWorkReleaseSchema,
} from "./UsIdCRCWorkReleaseReferralRecord";

const CRITERIA_COPY: CriteriaCopy<UsIdCRCWorkReleaseReferralRecord> = {
  eligibleCriteria: [
    custodyLevelIsMinimumCopy,
    notServingForSexualOffenseCopy,
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10YearsCopy,
    usIdNoDetainersForCrcCopy,
  ],
  ineligibleCriteria: [],
};

const DENIAL_REASONS_MAP = {
  MED: "Was not approved by an IDOC medical provider",
  PENDING:
    "There are pending felony charges or felony investigations in which the resident is a suspect",
  BEHAVIOR: "Resident has had poor institutional behavior",
  PROGRAM: "Missing required facility programming",
  [OTHER_KEY]: "Other, please specipy a reason",
};

export class UsIdCRCWorkReleaseOpportunity extends OpportunityBase<
  Resident,
  UsIdCRCWorkReleaseReferralRecord
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
      "usIdCRCWorkRelease",
      resident.rootStore,
      usIdCRCWorkReleaseSchema.parse
    );

    makeObservable(this, { requirementsMet: computed });
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(this.record, "eligibleCriteria", CRITERIA_COPY);
  }
}
