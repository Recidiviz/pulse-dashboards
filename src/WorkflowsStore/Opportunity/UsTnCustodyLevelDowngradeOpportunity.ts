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

import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { OpportunityUpdateWithForm } from "../../FirestoreStore";
import { Resident } from "../Resident";
import { UsTnCustodyLevelDowngradeForm } from "./Forms/usTnCustodyLevelDowngradeForm";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  UsTnCustodyLevelDowngradeDraftData,
  UsTnCustodyLevelDowngradeReferralRecord,
  usTnCustodyLevelDowngradeSchema,
} from "./UsTnCustodyLevelDowngradeReferralRecord";
import {
  CriteriaCopy,
  CriteriaFormatters,
  getFeatureVariantValidator,
  hydrateCriteria,
} from "./utils";

const CRITERIA_FORMATTERS: CriteriaFormatters<UsTnCustodyLevelDowngradeReferralRecord> =
  {} as const;

const CRITERIA_COPY: CriteriaCopy<UsTnCustodyLevelDowngradeReferralRecord> = {
  eligibleCriteria: [
    [
      "custodyLevelHigherThanRecommended",
      {
        text: "custodyLevelHigherThanRecommended",
      },
    ],
    ["custodyLevelIsNotMax", { text: "custodyLevelIsNotMax" }],
    [
      "usTnAtLeast6MonthsSinceMostRecentIncarcerationIncident",
      { text: "usTnAtLeast6MonthsSinceMostRecentIncarcerationIncident" },
    ],
    [
      "usTnHasHadAtLeast1IncarcerationIncidentPastYear",
      { text: "usTnHasHadAtLeast1IncarcerationIncidentPastYear" },
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
  ];

  constructor(resident: Resident) {
    super(
      resident,
      "usTnCustodyLevelDowngrade",
      resident.rootStore,
      usTnCustodyLevelDowngradeSchema.parse,
      getFeatureVariantValidator(resident, "usTnCustodyLevelDowngrade")
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: computed,
    });

    this.denialReasonsMap = {};

    this.form = new UsTnCustodyLevelDowngradeForm(
      "usTnCustodyLevelDowngrade",
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
}
