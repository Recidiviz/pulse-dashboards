// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { formatWorkflowsDate } from "../../../utils";
import {
  UsOrEarnedDischargeDraftData,
  UsOrEarnedDischargeOpportunity,
  UsOrEarnedDischargeSentenceDraftData,
  UsOrEarnedDischargeSubOpportunity,
} from "../UsOr";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class UsOrEarnedDischargeForm extends FormBase<
  UsOrEarnedDischargeDraftData,
  UsOrEarnedDischargeOpportunity
> {
  navigateToFormText = "Generate EDIS check-list";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "FormUsOrEarnedDischarge";
  }

  private static sentenceFormData(
    subOpportunity: UsOrEarnedDischargeSubOpportunity
  ): UsOrEarnedDischargeSentenceDraftData {
    const {
      sentenceStatute,
      sentenceSubType,
      sentenceStartDate,
      sentenceEndDate,
      sentenceCounty,
      judgeFullName,
      courtCaseNumber,
    } = subOpportunity.metadata;

    return {
      offenses: sentenceStatute,
      sentenceType: sentenceSubType,
      sentenceStartDate: formatWorkflowsDate(sentenceStartDate),
      sentenceExpirationDate: formatWorkflowsDate(sentenceEndDate),
      county: sentenceCounty,
      judgeName: judgeFullName ?? "",
      docket: courtCaseNumber,
    };
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsOrEarnedDischargeDraftData> =
    () => {
      if (!this.opportunity.record) return {};

      const { givenNames, middleNames, surname } = this.person.fullName;

      const clientId = this.person.externalId;

      const officerName = `${this.person.assignedStaff?.givenNames} ${this.person.assignedStaff?.surname}`;

      const todaysDate = formatWorkflowsDate(new Date());

      const sentences = Object.fromEntries(
        this.opportunity.record.subOpportunities.map((subopp) => [
          subopp.id,
          UsOrEarnedDischargeForm.sentenceFormData(subopp),
        ])
      );

      return {
        givenNames,
        middleNames,
        surname,
        clientId,
        officerName,
        todaysDate,
        sentences,
      };
    };
}
