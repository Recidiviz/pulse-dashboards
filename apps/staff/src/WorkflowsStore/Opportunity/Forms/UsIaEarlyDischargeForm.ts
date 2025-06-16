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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatNameFirstLast, formatWorkflowsDate } from "../../../utils";
import {
  UsIaEarlyDischargeDraftData,
  UsIaEarlyDischargeOpportunity,
} from "../UsIa";
import { FormBase } from "./FormBase";

export class UsIaEarlyDischargeForm extends FormBase<
  UsIaEarlyDischargeDraftData,
  UsIaEarlyDischargeOpportunity
> {
  get formContents(): OpportunityFormComponentName {
    return "FormUsIaEarlyDischargeParole";
  }

  prefilledDataTransformer(): Partial<UsIaEarlyDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};
    const {
      formInformation: {
        USCitizenshipStatus,
        // TODO: Handle multiple charges, penalties, and staff attributes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        charges: [charge, ..._],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        penalties: [penalty, ...__],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        staffAttributes: [staff, ...___],
      },
    } = this.opportunity.record;

    const {
      CauseNumber,
      Jurisdiction,
      counts,
      description,
      classificationTypeRawText,
    } = charge;

    const {
      SentencePenaltyType,
      PenaltyDays,
      PenaltyMonths,
      PenaltyYears,
      SentencePenaltyModifier,
    } = penalty;

    const {
      externalId,
      supervisionType,
      supervisionStartDate,
      expirationDate,
    } = this.person;

    const { StaffTitle, WorkUnit } = staff;

    return {
      usCitizenshipStatus: USCitizenshipStatus || "",
      todaysDate: formatWorkflowsDate(new Date()),
      iconNumber: externalId,
      clientFullName: formatNameFirstLast(this.person.fullName),
      causeNumber: CauseNumber,
      jurisdiction: Jurisdiction,
      counts,
      description,
      supervisionType,
      supervisionStartDate: formatWorkflowsDate(supervisionStartDate),
      classificationTypeRawText,
      supervisionEndDate: formatWorkflowsDate(expirationDate),
      sentencePenaltyType: SentencePenaltyType,
      sentencePenaltyModifier: SentencePenaltyModifier,
      penaltyDays: PenaltyDays,
      penaltyMonths: PenaltyMonths,
      penaltyYears: PenaltyYears,
      // TODO: Replace with actual officer name
      officerFullName: 'Todd "TODO" Todderson',
      staffTitle: StaffTitle || "",
      workUnit: WorkUnit,
    };
  }
}
