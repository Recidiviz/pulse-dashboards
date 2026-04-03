// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { DocumentData } from "@google-cloud/firestore";

import { OpportunityType } from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMoWorkReleaseForm } from "../../Forms/UsMoWorkReleaseForm/UsMoWorkReleaseForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  UsMoWorkReleaseReferralRecord,
  usMoWorkReleaseSchema,
} from "./UsMoWorkReleaseReferralRecord";

export class UsMoWorkReleaseOpportunity extends OpportunityBase<
  Resident,
  UsMoWorkReleaseReferralRecord
> {
  constructor(
    resident: Resident,
    record: DocumentData,
    opportunityType: OpportunityType,
  ) {
    super(
      resident,
      opportunityType,
      resident.rootStore,
      usMoWorkReleaseSchema.parse(record),
    );

    this.form = new UsMoWorkReleaseForm(this, resident.rootStore);
  }

  get nonOMSRequirements(): OpportunityRequirement[] {
    // Silent checks are criteria where we can't identify everyone who doesn't meet it,
    // but we can eliminate some people. For ineligible people they show up as red triangles,
    // but for those who are "eligible" they're still requirements to check.
    const silentChecks = [
      {
        criteria: "usMoMeetsTimeRemainingRequirementsWorkRelease",
        requirement: {
          text: "Arson I or Robbery I: Within 24 months of release and has completed 12+ months of outside clearance",
          tooltip:
            "If current or prior conviction for Arson I or Robbery I, resident must be within 24 months of earliest release date and must have completed at least 12 months on supervised outside clearance assignment.",
        },
      },
      {
        criteria: "usMoNoCurrentOrPriorExcludedOffensesWorkRelease",
        requirement: {
          text: "No current or prior conviction for an excluded offense",
          tooltip:
            "Excluded offenses are rape and attempted rape, sodomy and attempted sodomy, kidnapping, assault in the first degree, and murder in the first or second degree.",
        },
      },
      {
        criteria: "usMoNo112IncarcerationIncidentWithin2Years",
        requirement: {
          text: "No violations for introducing drugs or contraband within the past 2 years",
          tooltip:
            "Residents who have a history of introducing illicit drugs or contraband into a correctional facility (including suspicion of involvement, conspiracy, and investigation) cannot be considered for at least 2 years from the last violation.",
        },
      },
    ];

    return [
      ...silentChecks
        .filter(({ criteria }) => criteria in this.record.eligibleCriteria)
        .map(({ requirement }) => requirement),
      ...super.nonOMSRequirements,
    ];
  }
}
