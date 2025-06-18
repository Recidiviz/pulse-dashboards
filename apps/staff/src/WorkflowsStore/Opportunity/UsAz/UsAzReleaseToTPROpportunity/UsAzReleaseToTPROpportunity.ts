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

import { Resident } from "../../../Resident";
import { UsAzReleaseToTransitionProgramForm } from "../../Forms/UsAzReleaseToTransitionProgramForm";
import { OpportunityRequirement } from "../../types";
import { hydrateReq, hydrateUntypedCriteria } from "../../utils";
import { Reason } from "../../utils/criteriaUtils";
import {
  UsAzReleaseToTPRUpdateRecord,
  UsAzReleaseToTransitionProgramOpportunityBase,
} from "../UsAzReleaseToTransitionProgramOpportunityBase";
import {
  UsAzReleaseToTPRReferralRecord,
  usAzReleaseToTPRSchema,
} from "./UsAzReleaseToTPRReferralRecord";

export class UsAzReleaseToTPROpportunity extends UsAzReleaseToTransitionProgramOpportunityBase<
  UsAzReleaseToTPRReferralRecord,
  UsAzReleaseToTPRUpdateRecord
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzReleaseToTPR",
      resident.rootStore,
      usAzReleaseToTPRSchema.parse(record),
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
      (!metadata.acisTprDate && !metadata.projectedTprDate)
    )
      return undefined;

    const secondaryDate = metadata.acisTprDate ?? metadata.projectedTprDate;

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
          "usAzIncarcerationWithin6MonthsOfAcisTprDate",
          "usAzWithin7DaysOfRecidivizTprDate",
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
      this.record.ineligibleCriteria.usAzWithin7DaysOfRecidivizTprDate &&
      !this.record.eligibleCriteria.usAzIncarcerationWithin6MonthsOfAcisTprDate
    ) {
      return super.requirementsAlmostMet;
    }

    const {
      record: {
        eligibleCriteria: {
          usAzIncarcerationWithin6MonthsOfAcisTprDate: acisDate,
          usAzWithin7DaysOfRecidivizTprDate: recidivizDate,
        },
      },
      config: {
        eligibleCriteriaCopy: {
          usAzIncarcerationWithin6MonthsOfAcisTprDate: acisRaw,
          usAzWithin7DaysOfRecidivizTprDate: recidivizRaw,
        },
      },
    } = this;

    const criteria = (acisDate ?? recidivizDate) as Reason;
    const raw = acisDate ? acisRaw : recidivizRaw;
    const reqs = acisDate
      ? remove(
          super.requirementsAlmostMet,
          (r) => r.key === "usAzWithin7DaysOfRecidivizTprDate",
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
}
