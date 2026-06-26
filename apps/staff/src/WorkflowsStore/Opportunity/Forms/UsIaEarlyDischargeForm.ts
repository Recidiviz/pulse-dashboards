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

import { isDemoMode } from "~client-env-utils";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatNameFirstLast, formatWorkflowsDate } from "../../../utils";
import { UsIaEarlyDischargeOpportunity } from "../UsIa";
import { FormBase } from "./FormBase";
import { resolveCurrentUserName } from "./utils";

type PenaltyChargeExternalIdKey = `penaltyChargeExternalId${number}`;
type SentencePenaltyTypeKey = `sentencePenaltyType${number}`;
type PenaltyValueKey = `penaltyValue${number}`;
type SentencePenaltyModifierKey = `sentencePenaltyModifier${number}`;
type SentenceDateKey = `sentenceDate${number}`;
export type PenaltyRecords = Record<
  | PenaltyChargeExternalIdKey
  | SentencePenaltyTypeKey
  | PenaltyValueKey
  | SentencePenaltyModifierKey
  | SentenceDateKey,
  string
>;

type ChargeExternalIdKey = `chargeExternalId${number}`;
type CauseNumberKey = `causeNumber${number}`;
type JurisdictionKey = `jurisdiction${number}`;
type CountsKey = `counts${number}`;
type DescriptionKey = `description${number}`;
type StatuteKey = `statute${number}`;
type ClassificationTypeRawTextKey = `classificationTypeRawText${number}`;
type CrimeCdOffenseTypeKey = `crimeCdOffenseType${number}`;
type TddKey = `tdd${number}`;
type SddKey = `sdd${number}`;
export type ChargeRecords = Record<
  | ChargeExternalIdKey
  | CauseNumberKey
  | JurisdictionKey
  | CountsKey
  | DescriptionKey
  | StatuteKey
  | ClassificationTypeRawTextKey
  | CrimeCdOffenseTypeKey
  | TddKey
  | SddKey,
  string
>;

export type UsIaEarlyDischargeDraftData = {
  usCitizenshipStatus: string;
  todaysDate: string;
  iconNumber: string;
  clientFullName: string;
  supervisionType: string;
  supervisionStartDate: string;
  supervisionEndDate: string;

  numberOfCharges: number;
  numberOfPenalties: number;

  officerFullName: string;
  staffTitle: string;
  workUnit: string;

  dischargeDate: string;
  approverFullName: string;
  approverTitle: string;
  officerSignatureCbc: string;
  officerSignatureIdCbc: string;
  approverSignatureCbc: string;
  approverSignatureIdCbc: string;
  officerSignatureParole: string;
  officerSignatureIdParole: string;
  officerSignatureDateParole: string;
  approverSignatureParole: string;
  approverSignatureDateParole: string;
  approverSignatureIdParole: string;
  progressAndRecommendations: string;
  caseNumbers: string;

  hasCompletedProbation: boolean;
  clientStatusProbationForm: string;
  clientStatusDateProbationForm: string;
  remainsFinanciallyLiable: boolean;
  grantedDeferredJudgement: boolean;
  hasOtherProbationDischargeOrder: boolean;
  otherProbationDischargeOrderDetails: string;
} & PenaltyRecords &
  ChargeRecords;

export function packDraftData(draftData: UsIaEarlyDischargeDraftData) {
  const {
    usCitizenshipStatus,
    todaysDate,
    iconNumber,
    clientFullName,
    supervisionType,
    supervisionStartDate,
    supervisionEndDate,
    officerFullName,
    staffTitle,
    workUnit,
    dischargeDate,
    approverSignatureDateParole,
    officerSignatureDateParole,
    hasCompletedProbation,
    clientStatusProbationForm,
    clientStatusDateProbationForm,
    caseNumbers,
    remainsFinanciallyLiable,
    grantedDeferredJudgement,
    hasOtherProbationDischargeOrder,
    otherProbationDischargeOrderDetails,
    progressAndRecommendations,
    approverTitle,
    approverFullName,
    officerSignatureCbc,
    officerSignatureParole,
    approverSignatureCbc,
    approverSignatureParole,
  } = draftData;

  const penalties = [];
  for (let i = 0; i < draftData.numberOfPenalties; i++) {
    penalties.push({
      penaltyValue: draftData[`penaltyValue${i}`],
      penaltyType: draftData[`sentencePenaltyType${i}`],
      penaltyModifier: draftData[`sentencePenaltyModifier${i}`],
      sentenceDate: draftData[`sentenceDate${i}`],
      chargeExternalId: draftData[`penaltyChargeExternalId${i}`],
    });
  }

  const charges = [];
  for (let i = 0; i < draftData.numberOfCharges; i++) {
    const chargePenalties = penalties.filter((p) => {
      return p.chargeExternalId === draftData[`chargeExternalId${i}`];
    });

    charges.push({
      causeNumber: draftData[`causeNumber${i}`],
      jurisdiction: draftData[`jurisdiction${i}`],
      counts: String(draftData[`counts${i}`]),
      description: draftData[`description${i}`],
      statute: draftData[`statute${i}`],
      classification: draftData[`classificationTypeRawText${i}`],
      tdd: draftData[`tdd${i}`],
      sdd: draftData[`sdd${i}`],
      chargePenalties,
    });
  }

  return {
    usCitizenshipStatus,
    todaysDate,
    iconNumber,
    clientFullName,
    supervisionType,
    supervisionStartDate,
    supervisionEndDate,
    officerFullName,
    staffTitle,
    workUnit,
    dischargeDate,
    approverSignatureDateParole,
    officerSignatureDateParole,
    officerSignatureCbc,
    officerSignatureParole,
    approverSignatureCbc,
    approverSignatureParole,
    approverTitle,
    approverFullName,
    progressAndRecommendations,
    hasCompletedProbation,
    clientStatusProbationForm,
    clientStatusDateProbationForm,
    caseNumbers,
    remainsFinanciallyLiable,
    grantedDeferredJudgement,
    hasOtherProbationDischargeOrder,
    otherProbationDischargeOrderDetails,
    charges,
    penalties,
  };
}

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

  getCurrentUserFromFormRecord() {
    const { staffAttributes } = this.opportunity.record.formInformation;
    const { userStore } = this.rootStore;

    const staff = staffAttributes.find(
      (s) => s.officerExternalId === userStore.userAppMetadata?.externalId,
    );

    return staff;
  }

  get currentUserIsSupervisingOfficer(): boolean {
    // isDemoMode allows Recidiviz users to demo signature functionality
    return isDemoMode() || !!this.getCurrentUserFromFormRecord();
  }

  currentUserCanSignApproverField(formType: "cbc" | "parole"): boolean {
    if (isDemoMode()) return true;

    const { userStore } = this.rootStore;
    const signatureField =
      formType === "cbc" ? "officerSignatureCbc" : "officerSignatureParole";

    if (!this.formData[signatureField]) return false;

    const idField =
      formType === "cbc" ? "officerSignatureIdCbc" : "officerSignatureIdParole";

    return userStore.userAppMetadata?.externalId !== this.formData[idField];
  }

  prefilledDataTransformer(): Partial<UsIaEarlyDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const {
      formInformation: { USCitizenshipStatus, charges, penalties },
    } = this.opportunity.record;

    const numberOfCharges = charges.length;
    const chargeData: ChargeRecords = {};

    for (let i = 0; i < numberOfCharges; i++) {
      const {
        chargeExternalId,
        causeNumber,
        jurisdiction,
        counts,
        description,
        classificationTypeRawText,
        statute,
        sdd,
        tdd,
      } = charges[i];

      chargeData[`chargeExternalId${i}`] = chargeExternalId;
      chargeData[`causeNumber${i}`] = causeNumber;
      chargeData[`jurisdiction${i}`] = jurisdiction;
      chargeData[`counts${i}`] = `${counts}`;
      chargeData[`description${i}`] = description;
      chargeData[`classificationTypeRawText${i}`] = classificationTypeRawText;
      chargeData[`statute${i}`] = statute;
      chargeData[`tdd${i}`] = tdd ? formatWorkflowsDate(new Date(tdd)) : "";
      chargeData[`sdd${i}`] = sdd ? formatWorkflowsDate(new Date(sdd)) : "";
    }

    const caseNumbers = charges.map((charge) => charge.causeNumber).join(", ");

    const numberOfPenalties = penalties.length;
    const penaltyData: PenaltyRecords = {};

    for (let i = 0; i < numberOfPenalties; i++) {
      const {
        chargeExternalId,
        sentencePenaltyType,
        sentencePenaltyModifier,
        sentenceDate,
        penaltyValue,
      } = penalties[i];

      penaltyData[`penaltyChargeExternalId${i}`] = chargeExternalId;
      penaltyData[`penaltyValue${i}`] = penaltyValue;
      penaltyData[`sentencePenaltyType${i}`] = sentencePenaltyType;
      penaltyData[`sentencePenaltyModifier${i}`] = sentencePenaltyModifier;
      penaltyData[`sentenceDate${i}`] = sentenceDate;
    }

    const {
      externalId,
      supervisionType,
      supervisionStartDate,
      expirationDate,
    } = this.person;

    const { userStore, workflowsStore } = this.rootStore;

    const staff = this.getCurrentUserFromFormRecord();

    const staffTitle = staff?.staffTitle || "";
    const workUnit = staff?.workUnit || "";
    const officerFullName = resolveCurrentUserName(
      userStore,
      workflowsStore.user?.info,
      staff,
    );

    const todaysDate = formatWorkflowsDate(new Date());

    return {
      usCitizenshipStatus: USCitizenshipStatus || "",
      todaysDate,
      iconNumber: externalId,
      clientFullName: formatNameFirstLast(this.person.fullName),
      supervisionType,
      supervisionStartDate: formatWorkflowsDate(supervisionStartDate),
      supervisionEndDate: formatWorkflowsDate(expirationDate),
      officerFullName,
      staffTitle,
      workUnit,
      caseNumbers,

      hasCompletedProbation: false,
      remainsFinanciallyLiable: false,
      grantedDeferredJudgement: false,
      hasOtherProbationDischargeOrder: false,

      numberOfCharges,
      ...chargeData,
      numberOfPenalties,
      ...penaltyData,
    };
  }
}
