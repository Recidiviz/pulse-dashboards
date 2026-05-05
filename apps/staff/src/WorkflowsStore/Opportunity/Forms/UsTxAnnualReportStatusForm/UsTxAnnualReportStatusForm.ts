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
  fillAndSavePDF,
  PDFFillerFunc,
} from "../../../../core/Paperwork/PDFFormFiller";
import {
  flattenPDFFormSafely,
  setArsErsSharedPDFFields,
} from "../../../../core/Paperwork/US_TX/utils";
import { OpportunityFormComponentName } from "../../../../core/WorkflowsLayouts";
import { UsTxAnnualReportStatusOpportunity } from "../../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunity";
import { UsTxAnnualReportStatusDraftData } from "../../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunityReferralRecord";
import { prefilledArsErsSharedDraftData } from "../../UsTx/UsTxArsErsSharedUtils";
import { FormBase } from "../FormBase";
import arsTemplate from "./ARS.pdf";

const fillerFunc: PDFFillerFunc<UsTxAnnualReportStatusDraftData> = async (
  formData,
  set,
  form,
) => {
  setArsErsSharedPDFFields(formData, set);

  set("threeYearsTRASCheck", formData.threeYearsTRASCheck); // PDFCheckBox
  set("threeYearsTRASCheckNo", !formData.threeYearsTRASCheck); // PDFCheckBox
  set("comment1", formData.comment1); // PDFTextField

  set(
    "complianceFeesAndEducationCheck",
    formData.complianceFeesAndEducationCheck,
  ); // PDFCheckBox
  set(
    "complianceFeesAndEducationCheckNo",
    !formData.complianceFeesAndEducationCheck,
  ); // PDFCheckBox
  set("comment2", formData.comment2); // PDFTextField

  set("restitutionObligationsCheck", formData.restitutionObligationsCheck); // PDFCheckBox
  set("restitutionObligationsCheckNo", !formData.restitutionObligationsCheck); // PDFCheckBox
  set("comment3", formData.comment3); // PDFTextField

  set("warrantCheck", formData.warrantCheck); // PDFCheckBox
  set("warrantCheckNo", !formData.warrantCheck); // PDFCheckBox
  set("comment4", formData.comment4); // PDFTextField

  set("societyBestInterestCheck", formData.societyBestInterestCheck); // PDFCheckBox
  set("societyBestInterestCheckNo", !formData.societyBestInterestCheck); // PDFCheckBox
  set("comment5", formData.comment5); // PDFTextField

  flattenPDFFormSafely(form);
};

export class UsTxAnnualReportStatusForm extends FormBase<
  UsTxAnnualReportStatusDraftData,
  UsTxAnnualReportStatusOpportunity
> {
  navigateToFormText = "Download Form";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsTxAnnualReportStatusForm";
  }

  prefilledDataTransformer(): Partial<UsTxAnnualReportStatusDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    return {
      ...prefilledArsErsSharedDraftData(
        this.person,
        this.opportunity.record.formInformation,
      ),
      threeYearsTRASCheck: true,
      complianceFeesAndEducationCheck: true,
    };
  }

  async fillAndSaveFile(): Promise<void> {
    const nameBase = `${this.person.displayName} - Annual Reporting Status Form`;

    await fillAndSavePDF(
      `${nameBase}.pdf`,
      arsTemplate,
      fillerFunc,
      this.formData,
    );
  }
}
