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

import { FieldValue } from "@google-cloud/firestore";

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
import {
  arsErsUserHasFilledNecessaryFields,
  isUnchangedFromPrefilledValue,
  prefilledArsErsSharedDraftData,
} from "../../UsTx/UsTxArsErsSharedUtils";
import type { UsTxAnnualReportStatusV2DraftData } from "../../UsTx/UsTxDraftData";
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
  get navigateToFormText(): string {
    return "Download Form";
  }

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

  // Prepopulated fields (e.g. names pulled from the opportunity record) shouldn't
  // be saved as a user edit, or attributed to the user, unless the value actually
  // changes from what was prepopulated. If the field previously had a differing
  // draft and the user edits it back to match the prepopulated value, clear the
  // stale draft instead of leaving it out of sync with what's on screen.
  async updateDraftData(
    name: string,
    value: FieldValue | string | number | boolean,
  ): Promise<void> {
    const prefilledValue = (this.prefilledData as Record<string, unknown>)[
      name
    ];
    if (isUnchangedFromPrefilledValue(value, prefilledValue)) {
      if (name in this.draftData) {
        return this.clearDraftData(name);
      }
      return;
    }

    return super.updateDraftData(name, value);
  }

  userHasFilledNecessaryFields(): boolean {
    return arsErsUserHasFilledNecessaryFields({
      formLastUpdatedId: this?.formLastUpdated?.updateById,
      currentUserId: this?.currentUserId,
      formData: this?.formData,
      draftData: this?.draftData,
      fieldAuthors: this?.fieldAuthors,
      isInRevisionsRequested: this?.opportunity?.isInRevisionsRequested,
    });
  }
}
