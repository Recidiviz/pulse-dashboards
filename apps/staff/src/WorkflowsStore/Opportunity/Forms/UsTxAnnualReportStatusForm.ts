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
import { UsTxAnnualReportStatusOpportunity } from "../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunity";
import { UsTxAnnualReportStatusDraftData } from "../UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunityReferralRecord";
import { FormBase } from "./FormBase";

export class UsTxAnnualReportStatusForm extends FormBase<
  UsTxAnnualReportStatusDraftData,
  UsTxAnnualReportStatusOpportunity
> {
  navigateToFormText = "Download Form";
  allowRevert = false;

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsTxAnnualReportStatusForm";
  }

  prefilledDataTransformer(): Partial<UsTxAnnualReportStatusDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const clientName = this.person.displayName;
    const clientId = this.person.displayId;
    const eligibilityMonthString =
      this.opportunity.eligibilityDate?.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
    const threeYearsTRASCheckYes = true;
    const threeYearsTRASCheckNo = false;
    const complianceFeesAndEducationCheckYes = true;
    const complianceFeesAndEducationCheckNo = false;
    const restitutionObligationsCheckYes = true;
    const restitutionObligationsCheckNo = false;
    const warrantCheckYes = true;
    const warrantCheckNo = false;
    const societyBestInterestCheckYes = true;
    const societyBestInterestCheckNo = false;
    const officerName = this.person.assignedStaffFullName;
    const supervisingOfficerRecommendYes = false;
    const unitSupervisorConcurWithSupervisingOfficerYes = false;

    return {
      clientName,
      clientId,
      eligibilityMonthString,
      threeYearsTRASCheckYes,
      threeYearsTRASCheckNo,
      complianceFeesAndEducationCheckYes,
      complianceFeesAndEducationCheckNo,
      restitutionObligationsCheckYes,
      restitutionObligationsCheckNo,
      warrantCheckYes,
      warrantCheckNo,
      societyBestInterestCheckYes,
      societyBestInterestCheckNo,
      officerName,
      supervisingOfficerRecommendYes,
      unitSupervisorConcurWithSupervisingOfficerYes,
    };
  }
}
