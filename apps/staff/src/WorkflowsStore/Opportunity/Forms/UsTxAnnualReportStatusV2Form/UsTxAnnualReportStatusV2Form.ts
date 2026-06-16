// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { UsTxAnnualReportStatusV2Opportunity } from "../../UsTx/UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2Opportunity";
import { UsTxAnnualReportStatusV2DraftData } from "../../UsTx/UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2OpportunityReferralRecord";
import { prefilledArsErsSharedDraftData } from "../../UsTx/UsTxArsErsSharedUtils";
import { US_TX_ARS_ERS_BLOCKING_SUBMIT_FIELDS } from "../../UsTx/UsTxArsErsSharedUtils";
import { FormBase } from "../FormBase";
import arsTemplate from "./ARS.pdf";

const fillerFunc: PDFFillerFunc<UsTxAnnualReportStatusV2DraftData> = async (
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

export class UsTxAnnualReportStatusV2Form extends FormBase<
  UsTxAnnualReportStatusV2DraftData,
  UsTxAnnualReportStatusV2Opportunity
> {
  navigateToFormText = "Download Form";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsTxAnnualReportStatusForm";
  }

  prefilledDataTransformer(): Partial<UsTxAnnualReportStatusV2DraftData> {
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

  userHasFilledNecessaryFields(): boolean {
    const formLastUpdatedId = this?.formLastUpdated?.updateById;
    const currentUserId = this?.currentUserId;
    const formData = this?.formData;
    const draftData = this?.draftData;
    const fieldAuthors = this?.fieldAuthors;

    const isFieldFilled = (
      field: string | string[],
      data: Record<string, any> | undefined,
    ) =>
      Array.isArray(field) ? field.some((f) => !!data?.[f]) : !!data?.[field];

    const isFieldByCurrentUser = (field: string | string[]) =>
      Array.isArray(field)
        ? field.some((f) => fieldAuthors?.[f] === currentUserId)
        : fieldAuthors?.[field] === currentUserId;

    // A block is "started" if any user has written any of its fields into draftData.
    // Every started block must be fully complete in formData before submission is allowed.
    const allStartedBlocksComplete = Object.values(
      US_TX_ARS_ERS_BLOCKING_SUBMIT_FIELDS,
    ).every((formValues) => {
      const isStarted = formValues.some((field) =>
        isFieldFilled(field, draftData),
      );
      if (!isStarted) return true;
      return formValues.every((field) => isFieldFilled(field, formData));
    });

    // The current user must have personally authored at least one blocking field.
    // This prevents a user who only filled non-blocking fields (e.g. remarks) from
    // submitting on the strength of a different user's blocking-field edits.
    const atLeastOneBlockStarted = Object.values(
      US_TX_ARS_ERS_BLOCKING_SUBMIT_FIELDS,
    ).some((formValues) =>
      formValues.some((field) => isFieldByCurrentUser(field)),
    );

    return (
      atLeastOneBlockStarted &&
      allStartedBlocksComplete &&
      formLastUpdatedId === currentUserId
    );
  }
}
