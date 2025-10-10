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

import {
  OPPORTUNITY_STATUS_COLORS,
  StatusPalette,
} from "../../../../core/utils/workflowsUtils";
import { Resident } from "../../../Resident";
import {
  hydrateReq,
  hydrateUntypedCriteria,
  OpportunityRequirement,
  Reason,
} from "../..";
import { UsAzReleaseToTransitionProgramForm } from "../../Forms/UsAzReleaseToTransitionProgramForm";
import { convertStringToUTCDate } from "../../utils/dateUtils";
import { UsAzReleaseToTPRUpdateRecord } from "../UsAzReleaseToTransitionProgramOpportunityBase";
import { UsAzTprDtpOpportunityBase } from "../UsAzTprDtpBase/UsAzTprDtpBase";
import {
  UsAzReleaseToDTPReferralRecord,
  usAzReleaseToDTPSchema,
} from "./UsAzReleaseToDTPReferralRecord";

export class UsAzReleaseToDTPOpportunity extends UsAzTprDtpOpportunityBase<
  Resident,
  UsAzReleaseToDTPReferralRecord,
  UsAzReleaseToTPRUpdateRecord
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzReleaseToDTP",
      resident.rootStore,
      usAzReleaseToDTPSchema.parse(record),
    );

    this.form = new UsAzReleaseToTransitionProgramForm(
      this,
      resident.rootStore,
    );
  }

  get eligibilityDate(): Date | undefined {
    if (super.eligibilityDate) return super.eligibilityDate;

    const { metadata } = this.person;
    if (
      metadata.stateCode !== "US_AZ" ||
      (!metadata.acisDtpDate &&
        !metadata.projectedDtpDate &&
        !metadata.projectedTprDate)
    )
      return undefined;

    const secondaryDateString =
      metadata.acisDtpDate ??
      metadata.projectedDtpDate ??
      metadata.projectedTprDate;

    return secondaryDateString
      ? convertStringToUTCDate(secondaryDateString)
      : undefined;
  }

  get requirementsMet(): OpportunityRequirement[] {
    const {
      record,
      config: { eligibleCriteriaCopy },
    } = this;
    if (!record) return [];

    const filteredEligibleCriteriaCopyEntries = Object.entries(
      eligibleCriteriaCopy,
    ).filter(
      ([criteria, raw]) =>
        ![
          "usAzIncarcerationWithin6MonthsOfAcisDtpDate",
          "usAzWithin7DaysOfRecidivizDtpDate",
        ].includes(criteria),
    );

    return hydrateUntypedCriteria(
      record.eligibleCriteria as any,
      Object.fromEntries(filteredEligibleCriteriaCopyEntries),
      this,
      this.criteriaFormatters,
    );
  }

  /**
   * Gets the list of opportunity requirements that are almost met for this opportunity.
   *
   * If the client has a Recidiviz date, but no Acis date, it returns the parent's `requirementsAlmostMet`,
   * which will include the Recidiviz date as an almost met requirement.
   *
   * If the client has an Acis date, it returns the Acis date criteria as the only almost met requirement.
   *
   * @returns An array of `OpportunityRequirement` objects representing requirements that are almost met.
   */
  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (
      this.record.ineligibleCriteria.usAzWithin7DaysOfRecidivizDtpDate &&
      !this.record.eligibleCriteria.usAzIncarcerationWithin6MonthsOfAcisDtpDate
    )
      return super.requirementsAlmostMet;

    const {
      record: {
        eligibleCriteria: {
          usAzIncarcerationWithin6MonthsOfAcisDtpDate: acisDate,
        },
      },
      config: {
        eligibleCriteriaCopy: {
          usAzIncarcerationWithin6MonthsOfAcisDtpDate: acisRaw,
        },
      },
    } = this;

    const criteria = acisDate as Reason;
    const raw = acisRaw;

    return [
      hydrateReq({
        raw,
        opportunity: this,
        criteria,
        formatters: this.criteriaFormatters,
      }),
    ];
  }

  get customStatusPalette(): StatusPalette | undefined {
    return OPPORTUNITY_STATUS_COLORS.eligibleOverride;
  }

  eligibilityStatusLabel(includeReasons?: boolean): string | null {
    // Show "Marked Incorrect" instead of "Currently ineligible"
    if (this.denial?.reasons.length) {
      const statusText = "Marked Incorrect";
      const withReasons = includeReasons
        ? ` (${this.denial.reasons.join(", ")})`
        : "";

      return `${statusText}${withReasons}`;
    }

    // For all other cases, use the parent class logic
    return super.eligibilityStatusLabel(includeReasons);
  }
}
