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

import type { z } from "zod";

import type {
  ApplicationStage,
  Prisma,
  PrismaClient,
  TimelineActorRole,
} from "~@idaho-th/prisma/client";

import {
  ADVANCE_STAGE_APPLICATION_SELECT,
  ADVANCE_STAGE_RESULT_SELECT,
} from "./advanceStage.selects";
import type {
  acknowledgeApprovalRevokedSchema,
  advanceApplicationStageSchema,
  createHousingApplicationSchema,
  deleteHousingApplicationSchema,
  duplicateHousingApplicationSchema,
  setParoleCommissionDecisionSchema,
  updateHousingApplicationSchema,
} from "./staffApplication.schema";
import type { STAFF_OWNED_APPLICATION_SELECT } from "./staffApplication.selects";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type CreateHousingApplicationInput = z.infer<
  typeof createHousingApplicationSchema
>;

export type UpdateHousingApplicationInput = z.infer<
  typeof updateHousingApplicationSchema
>;

export type AdvanceApplicationStageInput = z.infer<
  typeof advanceApplicationStageSchema
>;

export type DeleteHousingApplicationInput = z.infer<
  typeof deleteHousingApplicationSchema
>;

export type DuplicateHousingApplicationInput = z.infer<
  typeof duplicateHousingApplicationSchema
>;

export type AcknowledgeApprovalRevokedInput = z.infer<
  typeof acknowledgeApprovalRevokedSchema
>;

export type SetParoleCommissionDecisionInput = z.infer<
  typeof setParoleCommissionDecisionSchema
>;

export type StaffOwnedApplicationRow =
  Prisma.StaffHousingApplicationGetPayload<{
    select: typeof STAFF_OWNED_APPLICATION_SELECT;
  }>;

export type AdvanceStageApplicationRow = Prisma.HousingApplicationGetPayload<{
  select: typeof ADVANCE_STAGE_APPLICATION_SELECT;
}>;

export type AdvanceStageApplicationRowWithStaff = Omit<
  AdvanceStageApplicationRow,
  "staffApplication"
> & {
  staffApplication: NonNullable<AdvanceStageApplicationRow["staffApplication"]>;
};

export type AdvanceApplicationStageResult = {
  applicationId: string;
} & Prisma.StaffHousingApplicationGetPayload<{
  select: typeof ADVANCE_STAGE_RESULT_SELECT;
}>;

export type AdvanceStageTimelineEventBase = {
  applicationId: string;
  actor: {
    role: typeof TimelineActorRole.STAFF;
    pseudonymizedId: string;
  };
};

export type BuildAdvanceStageTimelineEventArgs = {
  applicationId: string;
  staffPseudonymizedId: string;
  fromStage: ApplicationStage;
  targetStage: ApplicationStage;
  closedOutcome: AdvanceApplicationStageInput["closedOutcome"];
};
