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

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsClientProfile/OpportunityProfile";
import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { UsTnCustodyLevelDowngradeForm } from "../../Forms/usTnCustodyLevelDowngradeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "../../utils";
import {
  UsTnCustodyLevelDowngradeDraftData,
  UsTnCustodyLevelDowngradeReferralRecord,
  usTnCustodyLevelDowngradeSchema,
} from "./UsTnCustodyLevelDowngradeReferralRecord";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsTnCustodyLevelDowngradeReferralRecord> =
  {} as const;

const CRITERIA_COPY: CriteriaCopy<UsTnCustodyLevelDowngradeReferralRecord> = {
  eligibleCriteria: [
    [
      "custodyLevelHigherThanRecommended",
      {
        text: "Custody level is higher than latest CAF score suggests",
      },
    ],
    ["custodyLevelIsNotMax", { text: "Custody level is not maximum" }],
    [
      "usTnIneligibleForAnnualReclassification",
      { text: "Not eligible for annual reclassification" },
    ],
    [
      "usTnLatestCafAssessmentNotOverride",
      { text: "Last assessment did not include an override" },
    ],
  ],
  ineligibleCriteria: [],
};

export class UsTnCustodyLevelDowngradeOpportunity extends OpportunityBase<
  Resident,
  UsTnCustodyLevelDowngradeReferralRecord,
  OpportunityUpdateWithForm<UsTnCustodyLevelDowngradeDraftData>
> {
  resident: Resident;

  form: UsTnCustodyLevelDowngradeForm;

  // policyOrMethodologyUrl = "TBD";

  almostEligibleRecommendedNote = undefined;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "CaseNotes",
  ];

  readonly caseNotesTitle = "Disciplinaries";

  constructor(resident: Resident) {
    super(
      resident,
      "usTnCustodyLevelDowngrade",
      resident.rootStore,
      usTnCustodyLevelDowngradeSchema.parse
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = {
      [OTHER_KEY]: "Please specify a reason",
    };

    this.form = new UsTnCustodyLevelDowngradeForm(this, resident.rootStore);
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
