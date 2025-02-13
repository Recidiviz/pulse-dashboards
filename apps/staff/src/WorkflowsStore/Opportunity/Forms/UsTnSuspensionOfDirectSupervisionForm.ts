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
import { formatWorkflowsDate } from "../../../utils";
import { UsTnSuspensionOfDirectSupervisionOpportunity } from "../UsTn/UsTnSuspensionOfDirectSupervisionOpportunity/UsTnSuspensionOfDirectSupervisionOpportunity";
import { UsTnSuspensionOfDirectSupervisionDraftData } from "../UsTn/UsTnSuspensionOfDirectSupervisionOpportunity/UsTnSuspensionOfDirectSupervisionReferralRecord";
import { FormBase } from "./FormBase";

export class UsTnSuspensionOfDirectSupervisionForm extends FormBase<
  UsTnSuspensionOfDirectSupervisionDraftData,
  UsTnSuspensionOfDirectSupervisionOpportunity
> {
  navigateToFormText = "Generate paperwork";
  allowRevert = false;

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "FormUsTnSuspensionOfDirectSupervision";
  }

  get formType(): string {
    return "UsTnSuspensionOfDirectSupervisionForm";
  }

  prefilledDataTransformer(): Partial<UsTnSuspensionOfDirectSupervisionDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const downloadDate = formatWorkflowsDate(new Date());

    const {
      formInformation: {
        convictionCounties,
        convictionCharge,
        sentenceDate,
        supervisionDuration,
        supervisionOfficeLocation,
        latestNcic,
      },
    } = this.opportunity.record;

    const { contactDate, contactType, contactComment } = latestNcic || {};
    const allConvictionCounties = convictionCounties?.join(",");

    const {
      externalId,
      address,
      assignedStaffFullName,
      district,
      displayName: clientName,
      phoneNumber,
      expirationDate,
    } = this.person;

    // supervisionDuration is either 'Life', a number as a string representing the number of years, or undefined
    const formattedSupervisionDuration =
      supervisionDuration && !isNaN(Number(supervisionDuration))
        ? `${supervisionDuration} years`
        : supervisionDuration;

    const formattedExpirationDate = expirationDate
      ? formatWorkflowsDate(expirationDate)
      : "";

    const formattedSentenceDate = sentenceDate
      ? formatWorkflowsDate(sentenceDate)
      : "";

    const formattedContactDate = contactDate
      ? formatWorkflowsDate(contactDate)
      : "";

    return {
      downloadDate,
      clientName,
      externalId,
      address,
      phoneNumber,
      allConvictionCounties,
      convictionCharge,
      sentenceDate: formattedSentenceDate,
      expirationDate: formattedExpirationDate,
      supervisionDuration: formattedSupervisionDuration,
      assignedStaffFullName,
      district,
      supervisionOfficeLocation,
      latestNcicDate: formattedContactDate,
      latestNcicType: contactType,
      latestNcicContactComment: contactComment,
    };
  }
}
