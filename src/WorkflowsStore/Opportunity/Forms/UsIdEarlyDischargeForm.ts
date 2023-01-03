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
import {
  EarnedDischargeDraftData,
  EarnedDischargeReferralRecord,
} from "../EarnedDischargeReferralRecord";
import { FormBase } from "./FormBase";

export class UsIdEarnedDischargeForm extends FormBase<EarnedDischargeDraftData> {
  navigateToFormText = "Generate paperwork";

  prefilledDataTransformer(): Partial<EarnedDischargeDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const record = this.opportunity.record as EarnedDischargeReferralRecord;
    const {
      formInformation: { ncicCheckDate, crimeInformation },
    } = record;

    const initialData: Partial<EarnedDischargeDraftData> = {
      clientName: this.person.displayName,
      supervisionType: this.person.supervisionType,
      idocNumber: this.person.externalId,
      ftrDate: formatWorkflowsDate(this.person.expirationDate),
      conditionCompliance: "Yes",
      meetsIdocRequirements: "Yes",
      ncicCheck: "Yes",
    };

    if (ncicCheckDate) {
      initialData.ncicCheckDate = formatWorkflowsDate(ncicCheckDate);
    }

    if (crimeInformation) {
      if (crimeInformation.length > 0) {
        initialData.crimeName = crimeInformation[0].crimeName;
        initialData.sentencingJudge = crimeInformation[0].sentencingJudge;
        initialData.sentencingCounty = crimeInformation[0].sentencingCounty;
        initialData.sentencingDate = formatWorkflowsDate(
          crimeInformation[0].sentencingDate
        );
        initialData.caseNumber = crimeInformation[0].caseNumber;
        initialData.sentenceMin = crimeInformation[0].sentenceMin;
        initialData.sentenceMax = crimeInformation[0].sentenceMax;
        initialData.sentenceFTRD = formatWorkflowsDate(
          crimeInformation[0].sentenceFTRD
        );
      }

      if (crimeInformation.length > 1) {
        initialData.crimeName2 = crimeInformation[1].crimeName;
        initialData.sentencingJudge2 = crimeInformation[1].sentencingJudge;
        initialData.sentencingCounty2 = crimeInformation[1].sentencingCounty;
        initialData.sentencingDate2 = formatWorkflowsDate(
          crimeInformation[1].sentencingDate
        );
        initialData.caseNumber2 = crimeInformation[1].caseNumber;
        initialData.sentenceMin2 = crimeInformation[1].sentenceMin;
        initialData.sentenceMax2 = crimeInformation[1].sentenceMax;
        initialData.sentenceFTRD2 = formatWorkflowsDate(
          crimeInformation[1].sentenceFTRD
        );
      }
    }

    return initialData;
  }
}
