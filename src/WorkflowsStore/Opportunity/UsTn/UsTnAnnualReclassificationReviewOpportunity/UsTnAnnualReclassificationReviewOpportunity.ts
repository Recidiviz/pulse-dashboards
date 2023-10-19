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
import { formatDate } from "../../../../utils/formatStrings";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityRequirement } from "../..";
import { UsTnAnnualReclassificationReviewForm } from "../../Forms/UsTnAnnualReclassificationReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { CriteriaCopy, CriteriaFormatters, hydrateCriteria } from "../../utils";
import { UsTnSharedReclassificationDraftData } from "../UsTnSharedCriteria";
import {
  UsTnAnnualReclassificationReviewReferralRecord,
  usTnAnnualReclassificationReviewSchema,
} from "./UsTnAnnualReclassificationReviewReferralRecord";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsTnAnnualReclassificationReviewReferralRecord> =
  {} as const;

const CRITERIA_COPY: CriteriaCopy<UsTnAnnualReclassificationReviewReferralRecord> =
  {
    eligibleCriteria: [
      [
        "usTnAtLeast12MonthsSinceLatestAssessment",
        {
          text: "At least 12 months since last reclassification date",
        },
      ],
      ["custodyLevelIsNotMax", { text: "Custody level is not maximum" }],
    ],
    ineligibleCriteria: [],
  };

const DENIAL_REASONS_MAP = {
  // TODO(#4032): Add denial reasons once they've been finalized.
  OVERRIDE: "Reclassification date override",
  [OTHER_KEY]: "Please specify a reason",
};

export class UsTnAnnualReclassificationReviewOpportunity extends OpportunityBase<
  Resident,
  UsTnAnnualReclassificationReviewReferralRecord,
  OpportunityUpdateWithForm<UsTnSharedReclassificationDraftData>
> {
  resident: Resident;

  almostEligibleRecommendedNote = undefined;

  readonly caseNotesTitle = "Disciplinaries";

  form: UsTnAnnualReclassificationReviewForm;

  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "Incarceration",
    "CaseNotes",
    "UsTnCommonlyUsedOverrideCodes",
  ];

  // TODO(#4087): Set policyOrMethodologyUrl once we know what to set it to.

  denialReasonsMap = DENIAL_REASONS_MAP;

  readonly isAlert = true;

  constructor(resident: Resident) {
    super(
      resident,
      "usTnAnnualReclassification",
      resident.rootStore,
      usTnAnnualReclassificationReviewSchema.parse
    );

    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.form = new UsTnAnnualReclassificationReviewForm(
      this,
      resident.rootStore
    );
  }

  get requirementsMet(): OpportunityRequirement[] {
    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      CRITERIA_COPY,
      CRITERIA_FORMATTERS
    );
  }

  get eligibilityDate() {
    return this.record?.formReclassificationDueDate;
  }

  compare = this.sortByEligibilityDate;

  // eslint-disable-next-line class-methods-use-this
  showEligibilityStatus(): boolean {
    return true;
  }

  get eligibleStatusMessage() {
    if (this.eligibilityDate) {
      return `Due ${formatDate(this.eligibilityDate)}`;
    }
    return "Not Yet Classified";
  }
}
