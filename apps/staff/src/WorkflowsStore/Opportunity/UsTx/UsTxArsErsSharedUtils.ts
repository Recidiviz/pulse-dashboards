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

import startOfMonth from "date-fns/startOfMonth";

import { toTitleCase } from "../../../utils/formatStrings";
import { Client } from "../../Client";
import type { UsTxArsErsSharedFormInformation } from "./UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";

/**
 * Draft data fields that are identical across the ARS and ERS forms (header
 * info plus the 5 signature blocks). Form-specific draft data types should
 * intersect with this.
 */
export type UsTxArsErsSharedDraftData = {
  clientName: string;
  tdcjNumberAndSid: string;
  eligibilityMonthString: string;
  restitutionObligationsCheck: boolean;
  warrantCheck: boolean;
  societyBestInterestCheck: boolean;
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

export function prefilledArsErsSharedDraftData(
  client: Client,
  formInformation: UsTxArsErsSharedFormInformation,
): Partial<UsTxArsErsSharedDraftData> {
  const {
    tdcjNumber,
    unitSupervisor,
    paroleSupervisor,
    assistantRegionDirector,
    regionDirector,
  } = formInformation;

  const tdcjNumberAndSid = tdcjNumber
    ? `${tdcjNumber} / ${client.displayId}`
    : client.displayId;

  const eligibilityMonthString = startOfMonth(new Date()).toLocaleString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );

  return {
    clientName: client.displayName,
    tdcjNumberAndSid,
    eligibilityMonthString,
    restitutionObligationsCheck: true,
    warrantCheck: true,
    societyBestInterestCheck: true,
    officerName: client.assignedStaffFullName,
    unitSupervisorName: unitSupervisor ? toTitleCase(unitSupervisor) : "",
    paroleSupervisorName: paroleSupervisor ? toTitleCase(paroleSupervisor) : "",
    assistantRegionDirectorName: assistantRegionDirector
      ? toTitleCase(assistantRegionDirector)
      : "",
    regionDirectorName: regionDirector ? toTitleCase(regionDirector) : "",
  };
}
