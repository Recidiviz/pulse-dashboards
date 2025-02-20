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

import { DocxTemplateFormContents } from "../../../core/Paperwork/DOCXFormGenerator";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import {
  formatDurationFromDays,
  formatWorkflowsDate,
  toTitleCase,
} from "../../../utils";
import { EarnedDischargeDraftData, EarnedDischargeOpportunity } from "../UsId";
import { FormBase } from "./FormBase";
import {
  transformPossibleDateFields,
  transformPossibleNumberFields,
} from "./utils";

export class UsIdEarnedDischargeForm extends FormBase<
  EarnedDischargeDraftData,
  EarnedDischargeOpportunity
> {
  navigateToFormText = "Generate paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormEarnedDischarge";
  }

  get formType(): string {
    return "UsIdEarnedDischargeForm";
  }

  prefilledDataTransformer(): Partial<EarnedDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const { assignedStaff } = this.person;

    const {
      record: { formInformation },
    } = this.opportunity;
    const {
      chargeDescriptions,
      judgeNames,
      countyNames,
      dateImposed,
      caseNumbers,
      sentenceMax,
      sentenceMin,
      fullTermReleaseDates,
    } = formInformation;

    const initialData: Partial<EarnedDischargeDraftData> = {
      clientName: this.person.displayName,
      supervisionType: toTitleCase(this.person.supervisionType),
      probationOfficerFullName: assignedStaff
        ? `${assignedStaff.givenNames} ${assignedStaff.surname}`
        : "",
      idocNumber: this.person.externalId,
      ftrDate: formatWorkflowsDate(this.person.expirationDate),
      conditionCompliance: "Yes",
      meetsIdocRequirements: "Yes",
      ncicCheck: "Yes",
      ...transformPossibleDateFields(formInformation, [
        "ncicCheckDate",
        "firstAssessmentDate",
        "latestAssessmentDate",
      ]),
      ...transformPossibleNumberFields(formInformation, [
        "firstAssessmentScore",
        "latestAssessmentScore",
      ]),
    };

    initialData.numCrimeEntries = Math.max(
      fullTermReleaseDates?.length || 0,
      chargeDescriptions?.length || 0,
      judgeNames?.length || 0,
      countyNames?.length || 0,
      sentenceMax?.length || 0,
      sentenceMin?.length || 0,
      caseNumbers?.length || 0,
      dateImposed?.length || 0,
    );

    if (countyNames) {
      countyNames.forEach((county, index) => {
        initialData[`countyNames${index}`] = `${county} County`;
      });
    }

    if (judgeNames) {
      judgeNames.forEach((judge, index) => {
        initialData[`judgeNames${index}`] = `Judge ${toTitleCase(
          judge.givenNames,
        )} ${toTitleCase(judge.surname)}`;
      });
    }

    if (dateImposed) {
      dateImposed.forEach((date, index) => {
        initialData[`dateImposed${index}`] = formatWorkflowsDate(date);
      });
    }

    if (caseNumbers) {
      caseNumbers.forEach((caseNum, index) => {
        initialData[`caseNumbers${index}`] = caseNum;
      });
    }

    if (sentenceMax) {
      sentenceMax.forEach((val, index) => {
        initialData[`sentenceMax${index}`] = formatDurationFromDays(val);
      });
    }

    if (sentenceMin) {
      sentenceMin.forEach((val, index) => {
        initialData[`sentenceMin${index}`] = formatDurationFromDays(val);
      });
    }

    if (fullTermReleaseDates) {
      fullTermReleaseDates.forEach((date, index) => {
        initialData[`fullTermReleaseDates${index}`] = formatWorkflowsDate(date);
      });
    }

    if (chargeDescriptions) {
      chargeDescriptions.forEach((charge, index) => {
        initialData[`chargeDescriptions${index}`] = charge;
      });
    }

    return initialData;
  }

  prepareDataForTemplate(): DocxTemplateFormContents {
    const { formData } = this;

    const templateData: DocxTemplateFormContents = {
      clientName: formData.clientName,
      supervisionType: formData.supervisionType,
      idocNumber: formData.idocNumber,
      ftrDate: formData.ftrDate,
      probationOfficerFullName: formData.probationOfficerFullName,
      conditionCompliance: formData.conditionCompliance,
      meetsIdocRequirements: formData.meetsIdocRequirements,
      ncicCheck: formData.ncicCheck,
      ncicCheckDate: formData.ncicCheckDate,
      firstAssessmentScore: formData.firstAssessmentScore,
      firstAssessmentDate: formData.firstAssessmentDate,
      latestAssessmentScore: formData.latestAssessmentScore,
      latestAssessmentDate: formData.latestAssessmentDate,
      initialRestitution: formData.initialRestitution,
      lastRestitutionPaymentDate: formData.lastRestitutionPaymentDate,
      currentRestitutionBalance: formData.currentRestitutionBalance,
      initialFines: formData.initialFines,
      lastFinesPaymentDate: formData.lastFinesPaymentDate,
      currentFinesBalance: formData.currentFinesBalance,
      offenses: [],
    };

    for (let i = 0; i < (formData.numCrimeEntries ?? 0); i += 1) {
      templateData.offenses.push({
        judgeName: formData[`judgeNames${i}`],
        countyName: formData[`countyNames${i}`],
        dateImposed: formData[`dateImposed${i}`],
        caseNumber: formData[`caseNumbers${i}`],
        chargeDescription: formData[`chargeDescriptions${i}`],
        sentenceMin: formData[`sentenceMin${i}`],
        sentenceMax: formData[`sentenceMax${i}`],
        fullTermReleaseDate: formData[`fullTermReleaseDates${i}`],
      });
    }

    return templateData;
  }
}
