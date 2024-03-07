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

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { OpportunityRequirement } from "../../types";
import {
  CopyTuple,
  CriteriaCopy,
  CriteriaFormatters,
  hydrateCriteria,
} from "../../utils";
import {
  US_MO_DAYS_PAST,
  usMoInRestrictiveHousing,
  UsMoOverdueRestrictiveHousingBase,
} from "../UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import {
  UsMoOverdueRestrictiveHousingReleaseReferralRecord,
  usMoOverdueRestrictiveHousingReleaseSchema,
} from "./UsMoOverdueRestrictiveHousingReleaseReferralRecord";

const usMoNoActiveD1SanctionsDueDateCopy: CopyTuple<"usMoNoActiveD1Sanctions"> =
  [
    "usMoNoActiveD1Sanctions",
    {
      text: "No longer subject to D1 sanction $DAYS_PAST ($DATE)",
    },
  ];

const usMoNoActiveD1SanctionsCriteriaFormatter: NonNullable<
  CriteriaFormatters<UsMoOverdueRestrictiveHousingReleaseReferralRecord>[
    | "eligibleCriteria"
    | "ineligibleCriteria"]
>["usMoNoActiveD1Sanctions"] = {
  DAYS_PAST: (usMoNoActiveD1Sanctions) =>
    usMoNoActiveD1Sanctions && usMoNoActiveD1Sanctions.latestSanctionEndDate
      ? US_MO_DAYS_PAST(usMoNoActiveD1Sanctions.latestSanctionEndDate)
      : "date is unavailable",
  DATE: (usMoNoActiveD1Sanctions) =>
    usMoNoActiveD1Sanctions && usMoNoActiveD1Sanctions.latestSanctionEndDate
      ? formatWorkflowsDate(usMoNoActiveD1Sanctions.latestSanctionEndDate)
      : "N/A",
};

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingReleaseReferralRecord> =
  {
    eligibleCriteria: [
      usMoNoActiveD1SanctionsDueDateCopy,
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
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [usMoNoActiveD1SanctionsDueDateCopy],
  };

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMoOverdueRestrictiveHousingReleaseReferralRecord> =
  {
    eligibleCriteria: {
      usMoNoActiveD1Sanctions: usMoNoActiveD1SanctionsCriteriaFormatter,
    },
    ineligibleCriteria: {
      usMoNoActiveD1Sanctions: usMoNoActiveD1SanctionsCriteriaFormatter,
    },
  };

type ThisCriteriaCopyInstance = typeof CRITERIA_COPY;

/**
 * Removes `usMoD1SanctionAfterMostRecentHearing` if both `usMoD1SanctionAfterRestrictiveHousingStart`
 * are present
 * @param criteriaCopy
 * @returns {ThisCriteriaCopyInstance} {@link CRITERIA_COPY} unchanged or with `usMoD1SanctionAfterMostRecentHearing` removed.
 */
const removeDuplicateCopyIfPresent = (
  criteriaCopy: typeof CRITERIA_COPY,
  record: UsMoOverdueRestrictiveHousingReleaseReferralRecord | undefined,
): ThisCriteriaCopyInstance => {
  if (!record) return criteriaCopy;

  const {
    usMoD1SanctionAfterRestrictiveHousingStart,
    usMoD1SanctionAfterMostRecentHearing,
  } = record?.eligibleCriteria || record?.ineligibleCriteria || {};

  return usMoD1SanctionAfterRestrictiveHousingStart &&
    usMoD1SanctionAfterMostRecentHearing
    ? reduce(
        criteriaCopy,
        (acc: any, value: ValuesType<ThisCriteriaCopyInstance>, key) => {
          acc[key] = value.filter(
            (arr) => arr[0] !== "usMoD1SanctionAfterMostRecentHearing",
          );
          return acc as ThisCriteriaCopyInstance;
        },
        {},
      )
    : criteriaCopy;
};

export class UsMoOverdueRestrictiveHousingReleaseOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingReleaseReferralRecord> {
  resident: Resident;

  constructor(resident: Resident) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingRelease",
      usMoOverdueRestrictiveHousingReleaseSchema.parse,
    );
    this.resident = resident;

    makeObservable(this, {
      requirementsMet: override,
    });
  }

  get requirementsMet(): OpportunityRequirement[] {
    const { record } = this;
    return hydrateCriteria(
      record,
      "eligibleCriteria",
      removeDuplicateCopyIfPresent(CRITERIA_COPY, record),
      CRITERIA_FORMATTERS,
    );
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    const { record } = this;
    return hydrateCriteria(
      this.record,
      "ineligibleCriteria",
      removeDuplicateCopyIfPresent(CRITERIA_COPY, record),
      CRITERIA_FORMATTERS,
    );
  }

  get eligibilityDate(): Date | undefined {
    const sanctionInfo =
      this.record?.eligibleCriteria.usMoNoActiveD1Sanctions ??
      this.record?.ineligibleCriteria.usMoNoActiveD1Sanctions;

    return sanctionInfo?.latestSanctionEndDate ?? undefined;
  }

  get eligibleStatusMessage(): string {
    return this.generateUsMoOverdueEligibilityStatusMessage("Sanction", [
      "ended",
      "ends",
    ]);
  }
}
