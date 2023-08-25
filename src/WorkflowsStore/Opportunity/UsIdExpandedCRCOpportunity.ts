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

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../utils";
import { Resident } from "../Resident";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  UsIdExpandedCRCReferralRecord,
  usIdExpandedCRCSchema,
} from "./UsIdExpandedCRCReferralRecord";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "./utils";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsIdExpandedCRCReferralRecord> = {
  eligibleCriteria: {
    usIdInCrcFacility: {
      FACILITY_NAME: ({ facilityName }) => facilityName,
      START_DATE: ({ crcStartDate }) => formatWorkflowsDate(crcStartDate),
    },
  },
} as const;

const CRITERIA_COPY: CriteriaCopy<UsIdExpandedCRCReferralRecord> = {
  eligibleCriteria: [
    [
      "custodyLevelIsMinimum",
      {
        text: "Placeholder text for custodyLevelIsMinimum",
        tooltip: "Placeholder tooltip for custodyLevelIsMinimum",
      },
    ],
    [
      "notServingForSexualOffense",
      {
        text: "Placeholder text for notServingForSexualOffense",
        tooltip: "Placeholder tooltip for notServingForSexualOffense",
      },
    ],
    [
      "noAbsconsionWithin10Years",
      {
        text: "Placeholder text for noAbsconsionWithin10Years",
        tooltip: "Placeholder tooltip for noAbsconsionWithin10Years",
      },
    ],
    [
      "usIdNoEludingPoliceOffenseWithin10Years",
      {
        text: "Placeholder text for usIdNoEludingPoliceOffenseWithin10Years",
        tooltip:
          "Placeholder tooltip for usIdNoEludingPoliceOffenseWithin10Years",
      },
    ],
    [
      "usIdNoEscapeOffenseWithin10Years",
      {
        text: "Placeholder text for usIdNoEscapeOffenseWithin10Years",
        tooltip: "Placeholder tooltip for custodyLevelIsMinimum",
      },
    ],
    [
      "usIdNoDetainersForXcrc",
      {
        text: "Placeholder text for usIdNoDetainersForXcrc",
        tooltip: "Placeholder tooltip for usIdNoDetainersForXcrc",
      },
    ],
    [
      "usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd",
      {
        text: "Placeholder text for usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd",
        tooltip:
          "Placeholder tooltip for usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd",
      },
    ],
    [
      "usIdInCrcFacility",
      {
        text: "Resident in $FACILITY_NAME since $START_DATE",
        tooltip: "Placeholder tooltip for usIdInCrcFacility",
      },
    ],
    [
      "usIdInCrcFacilityFor60Days",
      {
        text: "Placeholder text for usIdInCrcFacilityFor60Days",
        tooltip: "Placeholder tooltip for usIdInCrcFacilityFor60Days",
      },
    ],
  ],
  ineligibleCriteria: [],
};

const DENIAL_REASONS_MAP = {
  PLACEHOLDER: "Placeholder denial reason",
  ANOTHER: "Another placeholder reason",
  [OTHER_KEY]: "Other, please specipy a reason",
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
