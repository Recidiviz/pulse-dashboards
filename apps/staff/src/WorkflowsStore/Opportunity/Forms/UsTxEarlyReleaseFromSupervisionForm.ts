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
import { UsTxEarlyReleaseFromSupervisionOpportunity } from "../UsTx/UsTxEarlyReleaseFromSupervisionOpportunity/UsTxEarlyReleaseFromSupervisionOpportunity";
import { UsTxEarlyReleaseFromSupervisionDraftData } from "../UsTx/UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";
import { FormBase } from "./FormBase";

const fillerFunc: PDFFillerFunc<
  UsTxEarlyReleaseFromSupervisionDraftData
> = async (formData, set, form) => {
  set("clientName", formData.clientName); // PDFTextField
  set("tdcjNumberAndSid", formData.tdcjNumberAndSid); // PDFTextField
  set("eligibilityMonthString", formData.eligibilityMonthString); // PDFTextField

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
  ); // PDFCheckBox
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

  set("officerName", formData.officerName); // PDFTextField
  set("supervisingOfficerDate", formData.supervisingOfficerDate); // PDFTextField
  set(
    "supervisingOfficerRecommendCheck",
    formData.supervisingOfficerRecommendCheckYes,
  ); // PDFCheckBox
  set(
    "supervisingOfficerRecommendCheckNo",
    formData.supervisingOfficerRecommendCheckNo,
  ); // PDFCheckBox
  set("supervisingOfficerSignature", formData.supervisingOfficerSignature); // PDFTextField
  set("supervisingOfficerRemarks", formData.supervisingOfficerRemarks); // PDFTextField

  set("unitSupervisorName", formData.unitSupervisorName); // PDFTextField
  set("unitSupervisorDate", formData.unitSupervisorDate); // PDFTextField
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheck",
    formData.unitSupervisorConcurWithSupervisingOfficerCheckYes,
  ); // PDFCheckBox
  set(
    "unitSupervisorConcurWithSupervisingOfficerCheckNo",
    formData.unitSupervisorConcurWithSupervisingOfficerCheckNo,
  ); // PDFCheckBox
  set("unitSupervisorSignature", formData.unitSupervisorSignature); // PDFTextField
  set("unitSupervisorRemarks", formData.unitSupervisorRemarks); // PDFTextField

  set("paroleSupervisorName", formData.paroleSupervisorName); // PDFTextField
  set("paroleSupervisorDate", formData.paroleSupervisorDate); // PDFTextField
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheck",
    formData.paroleSupervisorConcurWithSupervisingOfficerCheckYes,
  ); // PDFCheckBox
  set(
    "paroleSupervisorConcurWithSupervisingOfficerCheckNo",
    formData.paroleSupervisorConcurWithSupervisingOfficerCheckNo,
  ); // PDFCheckBox
  set("paroleSupervisorSignature", formData.paroleSupervisorSignature); // PDFTextField
  set("paroleSupervisorRemarks", formData.paroleSupervisorRemarks); // PDFTextField

  set("assistantRegionDirectorName", formData.assistantRegionDirectorName); // PDFTextField
  set("assistantRegionDirectorDate", formData.assistantRegionDirectorDate); // PDFTextField
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheck",
    formData.assistantRegionDirectorConcurWithSupervisingOfficerCheckYes,
  ); // PDFCheckBox
  set(
    "assistantRegionDirectorConcurWithSupervisingOfficerCheckNo",
    formData.assistantRegionDirectorConcurWithSupervisingOfficerCheckNo,
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
    formData.regionDirectorConcurWithSupervisingOfficerCheckYes,
  ); // PDFCheckBox
  set(
    "regionDirectorConcurWithSupervisingOfficerCheckNo",
    formData.regionDirectorConcurWithSupervisingOfficerCheckNo,
  ); // PDFCheckBox
  set("regionDirectorSignature", formData.regionDirectorSignature); // PDFTextField
  set("regionDirectorRemarks", formData.regionDirectorRemarks); // PDFTextField
  try {
    form.flatten();
  } catch (error) {
    console.error("Error flattening form:", error);
  }
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

    const atLeastHalfTimeCheck = true;
    const minimumThreeYearsSupervisionCheck = true;
    const goodFaithFeesAndEducationCheck = true;
    const restitutionObligationsCheck = true;
    const warrantCheck = true;
    const noViolationsCertificateCheck = true;
    const societyBestInterestCheck = true;
    const officerName = this.person.assignedStaffFullName;

    return {
      clientName,
      tdcjNumberAndSid,
      eligibilityMonthString,
      atLeastHalfTimeCheck,
      minimumThreeYearsSupervisionCheck,
      goodFaithFeesAndEducationCheck,
      restitutionObligationsCheck,
      warrantCheck,
      noViolationsCertificateCheck,
      societyBestInterestCheck,
      officerName,
    };
  }

  async fillAndSaveFile(): Promise<void> {
    const nameBase = `${this.person.displayName} - Early Release From Supervision Form`;

    await fillAndSavePDF(
      `${nameBase}.pdf`,
      "US_TX",
      "ERS.pdf",
      fillerFunc,
      this.formData,
      this.rootStore.getTokenSilently,
    );
  }
}
