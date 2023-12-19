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

import { reduce } from "lodash";
import { makeObservable, override } from "mobx";
import { ValuesType } from "utility-types";

import { OpportunityProfileModuleName } from "../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { Resident } from "../../../Resident";
import { OTHER_KEY } from "../../../utils";
import { OpportunityRequirement } from "../../types";
import { CriteriaCopy, hydrateCriteria } from "../../utils";
import {
  usMoInRestrictiveHousing,
  usMoNoActiveD1Sanctions,
  UsMoOverdueRestrictiveHousingBase,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import {
  UsMoOverdueRestrictiveHousingReleaseReferralRecord,
  usMoOverdueRestrictiveHousingReleaseSchema,
} from "./UsMoOverdueRestrictiveHousingReleaseReferralRecord";

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingReleaseReferralRecord> =
  {
    eligibleCriteria: [
      [
        "usMoD1SanctionAfterMostRecentHearing",
        {
          text: "In Restrictive Housing due to a D1 sanction",
        },
      ],
      [
        "usMoD1SanctionAfterRestrictiveHousingStart",
        {
          text: "In Restrictive Housing due to a D1 sanction",
        },
      ],
      usMoNoActiveD1Sanctions,
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [],
  };

export class UsMoOverdueRestrictiveHousingReleaseOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingReleaseReferralRecord> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "UsMoIncarceration",
    "UsMoRestrictiveHousing",
  ];

  resident: Resident;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingRelease",
      usMoOverdueRestrictiveHousingReleaseSchema.parse
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: override,
    });
  }

  denialReasonsMap = {
    "NOT UP-TO-DATE": "Released this week",
    [OTHER_KEY]: "Other",
  };

  get requirementsMet(): OpportunityRequirement[] {
    type ThisCriteriaCopyInstance = typeof CRITERIA_COPY;

    /**
     * Removes `usMoD1SanctionAfterMostRecentHearing` if both `usMoD1SanctionAfterRestrictiveHousingStart`
     * are present
     * @param criteriaCopy
     * @returns {ThisCriteriaCopyInstance} {@link CRITERIA_COPY} unchanged or with `usMoD1SanctionAfterMostRecentHearing` removed.
     */
    const REMOVE_DUPLICATE_COPY_IF_PRESENT = (
      criteriaCopy: typeof CRITERIA_COPY
    ): ThisCriteriaCopyInstance => {
      const {
        usMoD1SanctionAfterRestrictiveHousingStart,
        usMoD1SanctionAfterMostRecentHearing,
      } = this.record?.eligibleCriteria || {};

      return usMoD1SanctionAfterRestrictiveHousingStart &&
        usMoD1SanctionAfterMostRecentHearing
        ? reduce(
            criteriaCopy,
            (acc: any, value: ValuesType<ThisCriteriaCopyInstance>, key) => {
              acc[key] = value.filter(
                (arr) => arr[0] !== "usMoD1SanctionAfterMostRecentHearing"
              );
              return acc as ThisCriteriaCopyInstance;
            },
            {}
          )
        : criteriaCopy;
    };

    return hydrateCriteria(
      this.record,
      "eligibleCriteria",
      REMOVE_DUPLICATE_COPY_IF_PRESENT(CRITERIA_COPY)
    );
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria.usMoNoActiveD1Sanctions
      ?.latestSanctionEndDate;
  }

  get eligibleStatusMessage(): string {
    return super.generateUsMoOverdueEligibilityStatusMessage(
      "Segregation period",
      ["ended", "ends"]
    );
  }
}
