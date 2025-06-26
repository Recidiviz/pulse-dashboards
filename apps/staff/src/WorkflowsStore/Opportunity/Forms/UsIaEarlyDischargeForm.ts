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
  ChargeRecords,
  PenaltyRecords,
  UsIaEarlyDischargeDraftData,
  UsIaEarlyDischargeOpportunity,
} from "../UsIa";
import { FormBase } from "./FormBase";

export class UsIaEarlyDischargeForm extends FormBase<
  UsIaEarlyDischargeDraftData,
  UsIaEarlyDischargeOpportunity
> {
  get formContents(): OpportunityFormComponentName {
    if (this.person.supervisionType === "PAROLE") {
      return "FormUsIaEarlyDischargeParole";
    }
    return "FormUsIaEarlyDischargeProbation";
  }

  prefilledDataTransformer(): Partial<UsIaEarlyDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};
    const {
      formInformation: {
        USCitizenshipStatus,
        charges,
        penalties,
        // TODO: Handle multiple staff attributes
        staffAttributes: [staff],
      },
    } = this.opportunity.record;

    const numberOfCharges = charges.length;
    const chargeData: ChargeRecords = {};

    for (let i = 0; i < numberOfCharges; i++) {
      const {
        causeNumber,
        jurisdiction,
        counts,
        description,
        classificationTypeRawText,
        statute,
      } = charges[i];

      chargeData[`causeNumber${i}`] = causeNumber;
      chargeData[`jurisdiction${i}`] = jurisdiction;
      chargeData[`counts${i}`] = `${counts}`;
      chargeData[`description${i}`] = description;
      chargeData[`classificationTypeRawText${i}`] = classificationTypeRawText;
      chargeData[`statute${i}`] = statute;
    }

    const numberOfPenalties = penalties.length;
    const penaltyData: PenaltyRecords = {};

    for (let i = 0; i < numberOfPenalties; i++) {
      const {
        penaltyDays,
        penaltyMonths,
        penaltyYears,
        sentencePenaltyType,
        sentencePenaltyModifier,
        tdd,
      } = penalties[i];

      penaltyData[`penaltyDays${i}`] = penaltyDays;
      penaltyData[`penaltyMonths${i}`] = penaltyMonths;
      penaltyData[`penaltyYears${i}`] = penaltyYears;
      penaltyData[`sentencePenaltyType${i}`] = sentencePenaltyType;
      penaltyData[`sentencePenaltyModifier${i}`] = sentencePenaltyModifier;
      penaltyData[`tdd${i}`] = tdd ? formatWorkflowsDate(new Date(tdd)) : "";
    }

    const {
      externalId,
      supervisionType,
      supervisionStartDate,
      expirationDate,
    } = this.person;

    const { staffTitle, workUnit } = staff;

    const todaysDate = formatWorkflowsDate(new Date());

    return {
      usCitizenshipStatus: USCitizenshipStatus || "",
      todaysDate,
      iconNumber: externalId,
      clientFullName: formatNameFirstLast(this.person.fullName),
      supervisionType,
      supervisionStartDate: formatWorkflowsDate(supervisionStartDate),
      supervisionEndDate: formatWorkflowsDate(expirationDate),
      // TODO: Replace with actual officer name
      officerFullName: 'Todd "TODO" Todderson',
      staffTitle: staffTitle || "",
      workUnit,
      dischargeDate: "",
      supervisorSignatureDate: "",
      directorSignatureDate: "",

      hasCompletedProbation: false,
      probationCompletionStatus: "",
      probationCompletionDate: todaysDate,
      remainsFinanciallyLiable: false,
      grantedDeferredJudgement: false,
      hasOtherProbationDischargeOrder: false,
      otherProbationDischargeOrderDetails: "",

      numberOfCharges,
      ...chargeData,
      numberOfPenalties,
      ...penaltyData,
    };
  }
}
