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

import {
  deriveRcafFormData,
  prefillRcafFormData,
  UsTnReclassification2026DraftData,
} from "~datatypes";

import { prefilledCoverSheetData } from "../../../core/Paperwork/US_TN/CustodyReclassification/utils";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import {
  UsTnAnnualReclassification2026Opportunity,
  UsTnSeriousMisconductUpgradeOpportunity,
  UsTnTrusteeTransferOpportunity,
} from "../UsTn";
import { FormBase } from "./FormBase";

const QUESTION_TEMPLATE_MAP = {
  q3a: "q3Selection_0_6",
  q3b: "q3Selection_6_12",
  q4a: "q4Selection_0_6",
  q4b: "q4Selection_6_12",
  q5a: "q5Selection_0_6",
  q5b: "q5Selection_6_12",
  q5c: "q5Selection_12_18",
  q5d: "q5Selection_18_36",
  q5e: "q5Selection_36_60",
} satisfies Record<string, keyof UsTnReclassification2026DraftData>;

export class UsTnReclassification2026Form extends FormBase<
  UsTnReclassification2026DraftData,
  | UsTnAnnualReclassification2026Opportunity
  | UsTnTrusteeTransferOpportunity
  | UsTnSeriousMisconductUpgradeOpportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormUsTnReclassification2026";
  }

  prefilledDataTransformer() {
    const {
      opportunity: {
        record: { formInformation },
      },
      person,
    } = this;

    const rcafData = prefillRcafFormData(formInformation);

    const coverData = prefilledCoverSheetData(
      person,
      this.opportunity.type,
      formInformation,
    );

    return {
      ...formInformation,
      ...coverData,
      ...rcafData,
    };
  }

  get derivedData() {
    return deriveRcafFormData(this.formData);
  }

  get formTemplateData() {
    const { person, derivedData, formData } = this;

    const now = new Date();

    const templatedData: Record<string, string> = {};

    Object.entries(QUESTION_TEMPLATE_MAP).forEach(
      ([templatePrefix, dataKey]) => {
        const selection = formData[dataKey];
        templatedData[`${templatePrefix}0`] = selection === 0 ? "X" : "_";
        templatedData[`${templatePrefix}1`] = selection === 1 ? "X" : "_";
        templatedData[`${templatePrefix}2`] = selection === 2 ? "X" : "_";
        templatedData[`${templatePrefix}3`] = selection === 3 ? "X" : "_";
      },
    );

    return {
      ...formData,
      ...derivedData,
      ...templatedData,
      omsId: person.externalId,
      downloadDate: now.toLocaleDateString(),
      downloadTime: now.toLocaleTimeString(),
    };
  }
}
