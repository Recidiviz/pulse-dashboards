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
import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { UsAzReleaseToTransitionProgramForm } from "../../Forms/UsAzReleaseToTransitionProgramForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement, OpportunityTab } from "../../types";
import { hydrateReq, hydrateUntypedCriteria } from "../../utils/criteriaUtils";
import {
  UsAzOverdueForAcisTprReferralRecord,
  usAzOverdueForAcisTprSchema,
} from "./UsAzOverdueForAcisTprReferralRecord";

export class UsAzOverdueForAcisTprOpportunity extends OpportunityBase<
  Resident,
  UsAzOverdueForAcisTprReferralRecord
> {
  // TODO(#6707) move to configuration
  readonly caseNotesTitle = "Additional Information from ACIS";

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzOverdueForACISTPR",
      resident.rootStore,
      usAzOverdueForAcisTprSchema.parse(record),
    );

    this.form = new UsAzReleaseToTransitionProgramForm(
      this,
      resident.rootStore,
    );
  }

  get highlightCalloutText(): string {
    return `${this.person.displayName} is past their STP date on ${formatWorkflowsDate(this.eligibilityDate)}`;
  }

  get eligibilityDate(): Date {
    return (
      super.eligibilityDate ??
      new Date(
        this.record.eligibleCriteria.usAzIncarcerationPastAcisTprDate.acisTprDate,
      )
    );
  }

  tabTitle(): OpportunityTab {
    return "Overdue";
  }

  get eligibleStatusMessage() {
    return "Overdue";
  }

  showEligibilityStatus(): boolean {
    return true;
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
      ([criteria, raw]) => criteria !== "usAzIncarcerationPastAcisTprDate",
    );

    return hydrateUntypedCriteria(
      record.eligibleCriteria as any,
      Object.fromEntries(filteredEligibleCriteriaCopyEntries),
      this,
      this.criteriaFormatters,
    );
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    // Visually treat the overdue date as an almost eligible criteria as per #7489
    const {
      record,
      config: { eligibleCriteriaCopy },
    } = this;

    const { usAzIncarcerationPastAcisTprDate } = eligibleCriteriaCopy;

    const req: OpportunityRequirement = hydrateReq({
      raw: usAzIncarcerationPastAcisTprDate,
      opportunity: this,
      criteria: record.eligibleCriteria.usAzIncarcerationPastAcisTprDate,
      formatters: this.criteriaFormatters,
    });

    return [req, ...super.requirementsAlmostMet];
  }

  get customStatusPalette(): StatusPalette | undefined {
    return OPPORTUNITY_STATUS_COLORS.eligibleOverride;
  }
}
