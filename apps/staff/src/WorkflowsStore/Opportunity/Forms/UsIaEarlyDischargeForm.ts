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
        charges: [charge],
        penalties: [penalty],
        staffAttributes: [staff],
      },
    } = this.opportunity.record;

    const {
      causeNumber,
      jurisdiction,
      counts,
      description,
      classificationTypeRawText,
      statute,
    } = charge;

    const {
      sentencePenaltyType,
      penaltyDays,
      penaltyMonths,
      penaltyYears,
      sentencePenaltyModifier,
      judgeFullName,
      prosecutingAttorneys,
      tdd,
    } = penalty;

    const {
      externalId,
      supervisionType,
      supervisionStartDate,
      expirationDate,
    } = this.person;

    const { staffTitle, workUnit } = staff;

    return {
      usCitizenshipStatus: USCitizenshipStatus || "",
      todaysDate: formatWorkflowsDate(new Date()),
      iconNumber: externalId,
      clientFullName: formatNameFirstLast(this.person.fullName),
      causeNumber,
      jurisdiction,
      counts,
      description,
      statute,
      supervisionType,
      supervisionStartDate: formatWorkflowsDate(supervisionStartDate),
      classificationTypeRawText,
      judgeFullName: judgeFullName
        ? formatNameFirstLast(JSON.parse(judgeFullName))
        : "",
      prosecutingAttorneys: prosecutingAttorneys || "",
      tdd: tdd ? formatWorkflowsDate(new Date(tdd)) : "",
      supervisionEndDate: formatWorkflowsDate(expirationDate),
      sentencePenaltyType: sentencePenaltyType || "type",
      sentencePenaltyModifier: sentencePenaltyModifier || "modifier",
      penaltyDays: penaltyDays || "10",
      penaltyMonths: penaltyMonths || "0",
      penaltyYears: penaltyYears || "3",
      // TODO: Replace with actual officer name
      officerFullName: 'Todd "TODO" Todderson',
      staffTitle: staffTitle || "",
      workUnit,
      dischargeDate: "",
      supervisorSignatureDate: "",
      directorSignatureDate: "",
    };
  }
}
