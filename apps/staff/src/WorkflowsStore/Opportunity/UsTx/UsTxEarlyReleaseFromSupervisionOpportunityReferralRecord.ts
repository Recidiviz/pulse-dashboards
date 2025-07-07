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

export type UsTxEarlyReleaseFromSupervisionDraftData = {
  clientName: string;
  clientId: string;
  eligibilityMonthString: string;
  atLeastHalfTimeCheckYes: boolean;
  atLeastHalfTimeCheckNo: boolean;
  comment1: string;
  minimumThreeYearsSupervisionCheckYes: boolean;
  minimumThreeYearsSupervisionCheckNo: boolean;
  comment2: string;
  goodFaithFeesAndEducationCheckYes: boolean;
  goodFaithFeesAndEducationCheckNo: boolean;
  comment3: string;
  restitutionObligationsCheckYes: boolean;
  restitutionObligationsCheckNo: boolean;
  comment4: string;
  warrantCheckYes: boolean;
  warrantCheckNo: boolean;
  comment5: string;
  noViolationsCertificateCheckYes: boolean;
  noViolationsCertificateCheckNo: boolean;
  comment6: string;
  societyBestInterestCheckYes: boolean;
  societyBestInterestCheckNo: boolean;
  comment7: string;
  officerName: string;
  supervisingOfficerDate: string;
  supervisingOfficerRecommendYes: boolean;
  supervisingOfficerRemarks: string;
  unitSupervisorName: string;
  unitSupervisorDate: string;
  unitSupervisorConcurWithSupervisingOfficerYes: boolean;
  unitSupervisorRemarks: string;
};
