// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { DocumentData } from "firebase/firestore";
import { reduce } from "lodash";
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

const usMoNoActiveProgressiveDisciplineSanctionsDueDateCopy: CopyTuple<"usMoNoActiveProgressiveDisciplineSanctions"> =
  [
    "usMoNoActiveProgressiveDisciplineSanctions",
    {
      text: "No longer subject to progressive discipline sanction $DAYS_PAST ($DATE)",
    },
  ];

const usMoNoActiveProgressiveDisciplineSanctionsCriteriaFormatter: NonNullable<
  CriteriaFormatters<UsMoOverdueRestrictiveHousingReleaseReferralRecord>[
    | "eligibleCriteria"
    | "ineligibleCriteria"]
>["usMoNoActiveProgressiveDisciplineSanctions"] = {
  DAYS_PAST: (usMoNoActiveProgressiveDisciplineSanctions) =>
    usMoNoActiveProgressiveDisciplineSanctions &&
    usMoNoActiveProgressiveDisciplineSanctions.latestSanctionEndDate
      ? US_MO_DAYS_PAST(
          usMoNoActiveProgressiveDisciplineSanctions.latestSanctionEndDate,
        )
      : "date is unavailable",
  DATE: (usMoNoActiveProgressiveDisciplineSanctions) =>
    usMoNoActiveProgressiveDisciplineSanctions &&
    usMoNoActiveProgressiveDisciplineSanctions.latestSanctionEndDate
      ? formatWorkflowsDate(
          usMoNoActiveProgressiveDisciplineSanctions.latestSanctionEndDate,
        )
      : "N/A",
};

const CRITERIA_COPY: CriteriaCopy<UsMoOverdueRestrictiveHousingReleaseReferralRecord> =
  {
    eligibleCriteria: [
      usMoNoActiveProgressiveDisciplineSanctionsDueDateCopy,
      [
        "usMoProgressiveDisciplineSanctionAfterMostRecentHearing",
        {
          text: "In Restrictive Housing due to a progressive discipline sanction",
        },
      ],
      [
        "usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart",
        {
          text: "In Restrictive Housing due to a progressive discipline sanction",
        },
      ],
      usMoInRestrictiveHousing,
    ],
    ineligibleCriteria: [usMoNoActiveProgressiveDisciplineSanctionsDueDateCopy],
  };

const CRITERIA_FORMATTERS: CriteriaFormatters<UsMoOverdueRestrictiveHousingReleaseReferralRecord> =
  {
    eligibleCriteria: {
      usMoNoActiveProgressiveDisciplineSanctions:
        usMoNoActiveProgressiveDisciplineSanctionsCriteriaFormatter,
    },
    ineligibleCriteria: {
      usMoNoActiveProgressiveDisciplineSanctions:
        usMoNoActiveProgressiveDisciplineSanctionsCriteriaFormatter,
    },
  };

type ThisCriteriaCopyInstance = typeof CRITERIA_COPY;

/**
 * Removes `usMoProgressiveDisciplineSanctionAfterMostRecentHearing` if both `usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart`
 * are present
 * @param criteriaCopy
 * @returns {ThisCriteriaCopyInstance} {@link CRITERIA_COPY} unchanged or with `usMoProgressiveDisciplineSanctionAfterMostRecentHearing` removed.
 */
const removeDuplicateCopyIfPresent = (
  criteriaCopy: typeof CRITERIA_COPY,
  record: UsMoOverdueRestrictiveHousingReleaseReferralRecord | undefined,
): ThisCriteriaCopyInstance => {
  if (!record) return criteriaCopy;

  const {
    usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart,
    usMoProgressiveDisciplineSanctionAfterMostRecentHearing,
  } = record?.eligibleCriteria || record?.ineligibleCriteria || {};

  return usMoProgressiveDisciplineSanctionAfterRestrictiveHousingStart &&
    usMoProgressiveDisciplineSanctionAfterMostRecentHearing
    ? reduce(
        criteriaCopy,
        (acc: any, value: ValuesType<ThisCriteriaCopyInstance>, key) => {
          acc[key] = value.filter(
            (arr) =>
              arr[0] !==
              "usMoProgressiveDisciplineSanctionAfterMostRecentHearing",
          );
          return acc as ThisCriteriaCopyInstance;
        },
        {},
      )
    : criteriaCopy;
};

export class UsMoOverdueRestrictiveHousingReleaseOpportunity extends UsMoOverdueRestrictiveHousingBase<UsMoOverdueRestrictiveHousingReleaseReferralRecord> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMoOverdueRestrictiveHousingRelease",
      usMoOverdueRestrictiveHousingReleaseSchema.parse(record),
    );
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
      this.record?.eligibleCriteria
        .usMoNoActiveProgressiveDisciplineSanctions ??
      this.record?.ineligibleCriteria
        .usMoNoActiveProgressiveDisciplineSanctions;
    return (
      super.eligibilityDate ?? sanctionInfo?.latestSanctionEndDate ?? undefined
    );
  }

  get eligibleStatusMessage(): string {
    return this.generateUsMoOverdueEligibilityStatusMessage("Sanction", [
      "ended",
      "ends",
    ]);
  }
}
