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

import type {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  Prisma,
} from "~@idaho-th/prisma/client";

import type { ELIGIBLE_PROVIDER_STAFF_SELECT } from "./eligibleProvider.selects";

/** Stage/subStage/status on a staff or provider housing application record. */
export type WorkflowRecordCore = {
  stage: ApplicationStage;
  /** Null on staff drafts (stage DRAFT); always set for provider records. */
  subStage: ApplicationSubStage | null;
  status: ApplicationStatus;
};

export type WorkflowRecordWithUpdatedAt = WorkflowRecordCore & {
  updatedAt: Date;
};

/** Housing application columns used when mapping application detail responses. */
export type HousingApplicationDetailFields = {
  id: string;
  clientName: string;
  expectedReleaseDate: Date | null;
  idocNumber: string | null;
  formData: Prisma.JsonValue;
  sentToProvidersAt: Date | null;
  createdAt: Date;
};

export type EligibleProviderStaffRow =
  Prisma.EligibleHousingProviderGetPayload<{
    select: typeof ELIGIBLE_PROVIDER_STAFF_SELECT;
  }>;
