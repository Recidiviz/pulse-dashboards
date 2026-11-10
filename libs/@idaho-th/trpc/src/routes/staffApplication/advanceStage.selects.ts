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

import { type Prisma } from "~@idaho-th/prisma/client";

export const ADVANCE_STAGE_APPLICATION_SELECT = {
  id: true,
  formData: true,
  staffApplication: { select: { stage: true, paroleCommissionDecision: true } },
  homePlan: {
    select: {
      selectedProviderId: true,
      releaseDecision: true,
      homePlanInvestigation: true,
    },
  },
  providerApplications: {
    select: { id: true, providerId: true, stage: true, subStage: true },
  },
} as const satisfies Prisma.HousingApplicationSelect;

export const ADVANCE_STAGE_RESULT_SELECT = {
  stage: true,
  subStage: true,
  status: true,
  closedOutcome: true,
  closedOutcomeNote: true,
} as const satisfies Prisma.StaffHousingApplicationSelect;
