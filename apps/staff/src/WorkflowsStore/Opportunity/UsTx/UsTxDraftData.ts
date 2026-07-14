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

import type { UsTxArsErsSharedDraftData } from "./UsTxArsErsSharedUtils";

// TODO OBT-32657 Clean up V1 opp
export type UsTxEarlyReleaseFromSupervisionDraftData =
  UsTxArsErsSharedDraftData & {
    atLeastHalfTimeCheck: boolean;
    comment1: string;
    minimumThreeYearsSupervisionCheck: boolean;
    comment2: string;
    goodFaithFeesAndEducationCheck: boolean;
    comment3: string;
    comment4: string;
    comment5: string;
    noViolationsCertificateCheck: boolean;
    comment6: string;
    comment7: string;
  };

// TODO OBT-32657 Clean up V1 opp
export type UsTxAnnualReportStatusDraftData = UsTxArsErsSharedDraftData & {
  threeYearsTRASCheck: boolean;
  comment1: string;
  complianceFeesAndEducationCheck: boolean;
  comment2: string;
  comment3: string;
  comment4: string;
  comment5: string;
};

export type UsTxEarlyReleaseFromSupervisionV2DraftData =
  UsTxArsErsSharedDraftData & {
    atLeastHalfTimeCheck: boolean;
    comment1: string;
    minimumThreeYearsSupervisionCheck: boolean;
    comment2: string;
    goodFaithFeesAndEducationCheck: boolean;
    comment3: string;
    comment4: string;
    comment5: string;
    noViolationsCertificateCheck: boolean;
    comment6: string;
    comment7: string;
  };

export type UsTxAnnualReportStatusV2DraftData = UsTxArsErsSharedDraftData & {
  threeYearsTRASCheck: boolean;
  comment1: string;
  complianceFeesAndEducationCheck: boolean;
  comment2: string;
  comment3: string;
  comment4: string;
  comment5: string;
};
