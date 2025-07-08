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

export const usTxEarlyReleaseFromSupervisionSchema =
  opportunitySchemaBase.extend({
    formInformation: z
      .object({
        tdcjId: z.string(),
      })
      .partial(),
  });

export type UsTxEarlyReleaseFromSupervisionReferralRecord = z.infer<
  typeof usTxEarlyReleaseFromSupervisionSchema
>;

export type UsTxEarlyReleaseFromSupervisionDraftData = {
  clientName: string;
  tdcjIdAndSid: string;
  eligibilityMonthString: string;
  atLeastHalfTimeCheck: boolean;
  comment1: string;
  minimumThreeYearsSupervisionCheck: boolean;
  comment2: string;
  goodFaithFeesAndEducationCheck: boolean;
  comment3: string;
  restitutionObligationsCheck: boolean;
  comment4: string;
  warrantCheck: boolean;
  comment5: string;
  noViolationsCertificateCheck: boolean;
  comment6: string;
  societyBestInterestCheck: boolean;
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
