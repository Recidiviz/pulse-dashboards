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
import { prefilledArsErsSharedDraftData } from "../../UsTx/UsTxArsErsSharedUtils";
import { UsTxEarlyReleaseFromSupervisionOpportunity } from "../../UsTx/UsTxEarlyReleaseFromSupervisionOpportunity/UsTxEarlyReleaseFromSupervisionOpportunity";
import { UsTxEarlyReleaseFromSupervisionDraftData } from "../../UsTx/UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";
import { FormBase } from "../FormBase";
import ersTemplate from "./ERS.pdf";

const fillerFunc: PDFFillerFunc<
  UsTxEarlyReleaseFromSupervisionDraftData
> = async (formData, set, form) => {
  setArsErsSharedPDFFields(formData, set);

  set("atLeastHalfTimeCheck", formData.atLeastHalfTimeCheck); // PDFCheckBox
  set("atLeastHalfTimeCheckNo", !formData.atLeastHalfTimeCheck); // PDFCheckBox
  set("comment1", formData.comment1); // PDFTextField

  set(
    "minimumThreeYearsSupervisionCheck",
    formData.minimumThreeYearsSupervisionCheck,
  ); // PDFCheckBox
  set(
    "minimumThreeYearsSupervisionCheckNo",
    !formData.minimumThreeYearsSupervisionCheck,
  ); // PDFCheckBox
  set("comment2", formData.comment2); // PDFTextField

  set(
    "goodFaithFeesAndEducationCheck",
    formData.goodFaithFeesAndEducationCheck,
  );
  set(
    "goodFaithFeesAndEducationCheckNo",
    !formData.goodFaithFeesAndEducationCheck,
  ); // PDFCheckBox
  set("comment3", formData.comment3); // PDFTextField

  set("restitutionObligationsCheck", formData.restitutionObligationsCheck); // PDFCheckBox
  set("restitutionObligationsCheckNo", !formData.restitutionObligationsCheck); // PDFCheckBox
  set("comment4", formData.comment4); // PDFTextField

  set("warrantCheck", formData.warrantCheck); // PDFCheckBox
  set("warrantCheckNo", !formData.warrantCheck); // PDFCheckBox
  set("comment5", formData.comment5); // PDFTextField

  set("noViolationsCertificateCheck", formData.noViolationsCertificateCheck); // PDFCheckBox
  set("noViolationsCertificateCheckNo", !formData.noViolationsCertificateCheck); // PDFCheckBox
  set("comment6", formData.comment6); // PDFTextField

  set("societyBestInterestCheck", formData.societyBestInterestCheck); // PDFCheckBox
  set("societyBestInterestCheckNo", !formData.societyBestInterestCheck); // PDFCheckBox
  set("comment7", formData.comment7); // PDFTextField

  flattenPDFFormSafely(form);
};

export class UsTxEarlyReleaseFromSupervisionForm extends FormBase<
  UsTxEarlyReleaseFromSupervisionDraftData,
  UsTxEarlyReleaseFromSupervisionOpportunity
> {
  navigateToFormText = "Download Form";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsTxEarlyReleaseFromSupervisionForm";
  }

  prefilledDataTransformer(): Partial<UsTxEarlyReleaseFromSupervisionDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    return {
      ...prefilledArsErsSharedDraftData(
        this.person,
        this.opportunity.record.formInformation,
      ),
      atLeastHalfTimeCheck: true,
      minimumThreeYearsSupervisionCheck: true,
      goodFaithFeesAndEducationCheck: true,
      noViolationsCertificateCheck: true,
    };
  }

  async fillAndSaveFile(): Promise<void> {
    const nameBase = `${this.person.displayName} - Early Release From Supervision Form`;

    await fillAndSavePDF(
      `${nameBase}.pdf`,
      ersTemplate,
      fillerFunc,
      this.formData,
    );
  }
}
