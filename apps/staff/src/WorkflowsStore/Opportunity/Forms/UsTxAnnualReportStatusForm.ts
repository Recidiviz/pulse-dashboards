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

import startOfMonth from "date-fns/startOfMonth";

import {
  fillAndSavePDF,
  PDFFillerFunc,
} from "../../../core/Paperwork/PDFFormFiller";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { UsTxAnnualReportStatusOpportunity } from "../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunity";
import { UsTxAnnualReportStatusDraftData } from "../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunityReferralRecord";
import { FormBase } from "./FormBase";

const fillerFunc: PDFFillerFunc<UsTxAnnualReportStatusDraftData> = async (
  formData,
  set,
  form,
) => {
  set("clientName", formData.clientName); // PDFTextField
  set("tdcjNumberAndSid", formData.tdcjNumberAndSid); // PDFTextField
  set("eligibilityMonthString", formData.eligibilityMonthString); // PDFTextField

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

  set("officerName", formData.officerName); // PDFTextField
  set("supervisingOfficerDate", formData.supervisingOfficerDate); // PDFTextField
  set(
    "supervisingOfficerRecommendCheck",
    formData.supervisingOfficerRecommendCheck,
  ); // PDFCheckBox
  set(
    "supervisingOfficerRecommendCheckNo",
    !formData.supervisingOfficerRecommendCheck,
  ); // PDFCheckBox
  set("supervisingOfficerSignature", formData.supervisingOfficerSignature); // PDFTextField
  set("supervisingOfficerRemarks", formData.supervisingOfficerRemarks); // PDFTextField

  set("unitSupervisorName", formData.unitSupervisorName); // PDFTextField
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheck",
    formData.unitSupervisorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheckNo",
    !formData.unitSupervisorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set("unitSupervisorDate", formData.unitSupervisorDate); // PDFTextField
  set("unitSupervisorSignature", formData.unitSupervisorSignature); // PDFTextField
  set("unitSupervisorRemarks", formData.unitSupervisorRemarks); // PDFTextField

  set("paroleSupervisorName", formData.paroleSupervisorName); // PDFTextField
  set("paroleSupervisorDate", formData.paroleSupervisorDate); // PDFTextField
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheck",
    formData.paroleSupervisorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheckNo",
    !formData.paroleSupervisorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set("paroleSupervisorSignature", formData.paroleSupervisorSignature); // PDFTextField
  set("paroleSupervisorRemarks", formData.paroleSupervisorRemarks); // PDFTextField

  set("assistantRegionDirectorName", formData.assistantRegionDirectorName); // PDFTextField
  set("assistantRegionDirectorDate", formData.assistantRegionDirectorDate); // PDFTextField
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheck",
    formData.assistantRegionDirectorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheckNo",
    !formData.assistantRegionDirectorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set(
    "assistantRegionDirectorSignature",
    formData.assistantRegionDirectorSignature,
  ); // PDFTextField
  set(
    "assistantRegionDirectorRemarks",
    formData.assistantRegionDirectorRemarks,
  ); // PDFTextField

  set("regionDirectorName", formData.regionDirectorName); // PDFTextField
  set("regionDirectorDate", formData.regionDirectorDate); // PDFTextField
  set(
    "regionDirectorConcurWithSupervisingOfficerCheck",
    formData.regionDirectorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set(
    "regionDirectorConcurWithSupervisingOfficerCheckNo",
    !formData.regionDirectorConcurWithSupervisingOfficerCheck,
  ); // PDFCheckBox
  set("regionDirectorSignature", formData.regionDirectorSignature); // PDFTextField
  set("regionDirectorRemarks", formData.regionDirectorRemarks); // PDFTextField
  try {
    form.flatten();
  } catch (error) {
    console.error("Error flattening form:", error);
  }
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

    const clientName = this.person.displayName;
    const clientId = this.person.displayId;

    const {
      formInformation: { tdcjNumber },
    } = this.opportunity.record;

    const tdcjNumberAndSid = tdcjNumber
      ? tdcjNumber + " / " + clientId
      : clientId;

    const eligibilityMonthString = startOfMonth(new Date()).toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );
    const threeYearsTRASCheck = true;
    const complianceFeesAndEducationCheck = true;
    const restitutionObligationsCheck = true;
    const warrantCheck = true;
    const societyBestInterestCheck = true;
    const officerName = this.person.assignedStaffFullName;

    return {
      clientName,
      tdcjNumberAndSid,
      eligibilityMonthString,
      threeYearsTRASCheck,
      complianceFeesAndEducationCheck,
      restitutionObligationsCheck,
      warrantCheck,
      societyBestInterestCheck,
      officerName,
    };
  }

  async fillAndSaveFile(): Promise<void> {
    const nameBase = `${this.person.displayName} - Annual Reporting Status Form`;

    await fillAndSavePDF(
      `${nameBase}.pdf`,
      "US_TX",
      "ARS.pdf",
      fillerFunc,
      this.formData,
      this.rootStore.getTokenSilently,
    );
  }
}
