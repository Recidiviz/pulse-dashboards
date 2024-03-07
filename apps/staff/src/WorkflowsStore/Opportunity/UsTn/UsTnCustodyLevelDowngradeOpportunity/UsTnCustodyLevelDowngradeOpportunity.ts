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

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Resident } from "../../../Resident";
import { UsTnAnnualReclassificationReviewForm } from "../../Forms/UsTnAnnualReclassificationReviewForm";
import { UsTnCustodyLevelDowngradeForm } from "../../Forms/usTnCustodyLevelDowngradeForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  CriteriaCopy,
  CriteriaFormatters,
  hydrateCriteria,
} from "../../utils/criteriaUtils";
import { UsTnSharedReclassificationDraftData } from "../UsTnSharedCriteria";
import {
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
  OpportunityUpdateWithForm<UsTnSharedReclassificationDraftData>
> {
  resident: Resident;

  form: UsTnCustodyLevelDowngradeForm;

  // TODO(#4087): Set policyOrMethodologyUrl once we know what to set it to.

  almostEligibleRecommendedNote = undefined;

  readonly caseNotesTitle = "Disciplinaries";

  constructor(resident: Resident) {
    super(
      resident,
      "usTnCustodyLevelDowngrade",
      resident.rootStore,
      usTnCustodyLevelDowngradeSchema.parse,
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    if (
      this.resident.rootStore.workflowsStore.featureVariants
        .usTnAnnualReclassification
    ) {
      this.form = new UsTnAnnualReclassificationReviewForm(
        this,
        resident.rootStore,
      );
    } else {
      this.form = new UsTnCustodyLevelDowngradeForm(this, resident.rootStore);
    }
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
