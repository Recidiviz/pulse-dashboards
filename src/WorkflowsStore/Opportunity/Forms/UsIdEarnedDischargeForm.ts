/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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

import { formatWorkflowsDate } from "../../../utils";
import { EarnedDischargeOpportunity } from "../EarnedDischargeOpportunity";
import { EarnedDischargeDraftData } from "../EarnedDischargeReferralRecord";
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

  prefilledDataTransformer(): Partial<EarnedDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};

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
      supervisionType: this.person.supervisionType,
      idocNumber: this.person.externalId,
      ftrDate: formatWorkflowsDate(this.person.expirationDate),
      conditionCompliance: "Yes",
      meetsIdocRequirements: "Yes",
      ncicCheck: "Yes",
      ...transformPossibleDateFields(formInformation, [
        "ncicCheckDate",
        "firstAssessmentDate",
        "latestAssessmentDate",
        "lastFinesPaymentDate",
        "lastRestitutionPaymentDate",
      ]),
      ...transformPossibleNumberFields(formInformation, [
        "initialFines",
        "initialRestitution",
        "firstAssessmentScore",
        "currentFinesBalance",
        "currentRestitutionBalance",
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
      dateImposed?.length || 0
    );

    if (countyNames) {
      countyNames.forEach((county, index) => {
        initialData[`countyNames${index}`] = county;
      });
    }

    if (judgeNames) {
      judgeNames.forEach((judge, index) => {
        initialData[
          `judgeNames${index}`
        ] = `${judge.givenNames} ${judge.surname}`;
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
        initialData[`sentenceMax${index}`] = val.toString();
      });
    }

    if (sentenceMin) {
      sentenceMin.forEach((val, index) => {
        initialData[`sentenceMin${index}`] = val.toString();
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
}
