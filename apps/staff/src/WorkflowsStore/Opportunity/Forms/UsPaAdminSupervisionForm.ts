/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatWorkflowsDate } from "../../../utils";
import { UsPaAdminSupervisionOpportunity } from "../UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import { UsPaAdminSupervisionDraftData } from "../UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import { FormBase } from "./FormBase";

export class UsPaAdminSupervisionForm extends FormBase<
  UsPaAdminSupervisionDraftData,
  UsPaAdminSupervisionOpportunity
> {
  navigateToFormText = "Complete checklist";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "FormUsPaAdminSupervision";
  }

  prefilledDataTransformer(): Partial<UsPaAdminSupervisionDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const {
      fullName: { givenNames, surname },
      externalId: paroleNumber,
      supervisionLevel: currentGradeOfSupervisionLevel,
    } = this.person;

    const reentrantName = `${surname}, ${givenNames}`;

    const dateOfReview = formatWorkflowsDate(new Date());

    return {
      reentrantName,
      paroleNumber,
      currentGradeOfSupervisionLevel,
      dateOfReview,
    };
  }
}