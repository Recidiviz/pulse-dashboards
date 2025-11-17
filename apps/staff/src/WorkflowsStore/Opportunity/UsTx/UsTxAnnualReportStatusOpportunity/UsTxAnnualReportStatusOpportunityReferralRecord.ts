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
import { z } from "zod";

import { opportunitySchemaBase } from "~datatypes";

export const usTxAnnualReportStatusSchema = opportunitySchemaBase.extend({
  formInformation: z
    .object({
      tdcjNumber: z.string(),
    })
    .partial(),
});

export type UsTxAnnualReportStatusReferralRecord = z.infer<
  typeof usTxAnnualReportStatusSchema
>;

export type UsTxAnnualReportStatusDraftData = {
  clientName: string;
  tdcjNumberAndSid: string;
  eligibilityMonthString: string;
  threeYearsTRASCheck: boolean;
  comment1: string;
  complianceFeesAndEducationCheck: boolean;
  comment2: string;
  restitutionObligationsCheck: boolean;
  comment3: string;
  warrantCheck: boolean;
  comment4: string;
  societyBestInterestCheck: boolean;
  comment5: string;
  officerName: string;
  supervisingOfficerDate: string;
  supervisingOfficerRecommendCheckYes: boolean;
  supervisingOfficerRecommendCheckNo: boolean;
  supervisingOfficerSignature: string;
  supervisingOfficerRemarks: string;
  unitSupervisorName: string;
  unitSupervisorConcurWithSupervisingOfficerCheckYes: boolean;
  unitSupervisorConcurWithSupervisingOfficerCheckNo: boolean;
  unitSupervisorDate: string;
  unitSupervisorSignature: string;
  unitSupervisorRemarks: string;
  paroleSupervisorName: string;
  paroleSupervisorDate: string;
  paroleSupervisorConcurWithSupervisingOfficerCheckYes: boolean;
  paroleSupervisorConcurWithSupervisingOfficerCheckNo: boolean;
  paroleSupervisorSignature: string;
  paroleSupervisorRemarks: string;
  assistantRegionDirectorName: string;
  assistantRegionDirectorDate: string;
  assistantRegionDirectorConcurWithSupervisingOfficerCheckYes: boolean;
  assistantRegionDirectorConcurWithSupervisingOfficerCheckNo: boolean;
  assistantRegionDirectorSignature: string;
  assistantRegionDirectorRemarks: string;
  regionDirectorName: string;
  regionDirectorDate: string;
  regionDirectorConcurWithSupervisingOfficerCheckYes: boolean;
  regionDirectorConcurWithSupervisingOfficerCheckNo: boolean;
  regionDirectorSignature: string;
  regionDirectorRemarks: string;
};
