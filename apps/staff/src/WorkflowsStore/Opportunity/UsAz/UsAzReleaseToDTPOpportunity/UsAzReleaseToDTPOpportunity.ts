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
import { remove } from "lodash";

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
import {
  UsAzReleaseToTPRUpdateRecord,
  UsAzReleaseToTransitionProgramOpportunityBase,
} from "../UsAzReleaseToTransitionProgramOpportunityBase";
import {
  UsAzReleaseToDTPReferralRecord,
  usAzReleaseToDTPSchema,
} from "./UsAzReleaseToDTPReferralRecord";

export class UsAzReleaseToDTPOpportunity extends UsAzReleaseToTransitionProgramOpportunityBase<
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

    const secondaryDate =
      metadata.acisDtpDate ??
      metadata.projectedDtpDate ??
      metadata.projectedTprDate;

    return secondaryDate ? new Date(secondaryDate) : undefined;
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
          usAzWithin7DaysOfRecidivizDtpDate: recidivizDate,
        },
      },
      config: {
        eligibleCriteriaCopy: {
          usAzIncarcerationWithin6MonthsOfAcisDtpDate: acisRaw,
          usAzWithin7DaysOfRecidivizDtpDate: recidivizRaw,
        },
      },
    } = this;

    const criteria = (acisDate ?? recidivizDate) as Reason;
    const raw = acisDate ? acisRaw : recidivizRaw;
    const reqs = acisDate
      ? remove(
          super.requirementsAlmostMet,
          (r) => r.key === "usAzWithin7DaysOfRecidivizDtpDate",
        )
      : super.requirementsAlmostMet;

    return [
      hydrateReq({
        raw,
        opportunity: this,
        criteria,
        formatters: this.criteriaFormatters,
      }),
      ...reqs,
    ];
  }

  get customStatusPalette(): StatusPalette | undefined {
    return OPPORTUNITY_STATUS_COLORS.eligibleOverride;
  }
}
