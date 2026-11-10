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

import {
  ApplicationStage,
  type Prisma,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import type { RecordTimelineEventArgs } from "~@idaho-th/trpc/routes/timeline/timeline.types";

import { mapClosedOutcomeToSubStage } from "./advanceStage.progression";
import {
  ADVANCE_STAGE_APPLICATION_SELECT,
  ADVANCE_STAGE_RESULT_SELECT,
} from "./advanceStage.selects";
import { STAFF_APPLICATION_NOT_FOUND } from "./staffApplication.constants";
import { throwStaffApplicationNotFound } from "./staffApplication.helpers";
import type {
  AdvanceStageApplicationRow,
  AdvanceStageApplicationRowWithStaff,
  AdvanceStageTimelineEventBase,
  BuildAdvanceStageTimelineEventArgs,
  DbClient,
} from "./staffApplication.types";

export async function findStaffAdvanceStageApplication(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<AdvanceStageApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      staffApplication: { staffPseudonymizedId },
    },
    select: ADVANCE_STAGE_APPLICATION_SELECT,
  });
}

export function requireStaffAdvanceStageApplication(
  context: AdvanceStageApplicationRow | null,
): asserts context is AdvanceStageApplicationRowWithStaff {
  if (context == null || context.staffApplication == null) {
    throwStaffApplicationNotFound(
      STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
    );
  }
}

export async function updateHousingApplicationAdvanceStage(
  client: DbClient,
  applicationId: string,
  data: Prisma.HousingApplicationUpdateInput,
) {
  return client.housingApplication.update({
    where: { id: applicationId },
    data: { ...data, lastActivityAt: new Date() },
    select: { staffApplication: { select: ADVANCE_STAGE_RESULT_SELECT } },
  });
}

const ADVANCE_STAGE_TIMELINE_EVENT_BUILDERS = {
  close: (
    base: AdvanceStageTimelineEventBase,
    closedOutcome: BuildAdvanceStageTimelineEventArgs["closedOutcome"],
  ): RecordTimelineEventArgs => ({
    ...base,
    type: TimelineEventType.CASE_CLOSED,
    closedSubStage: mapClosedOutcomeToSubStage(closedOutcome),
  }),
  advance: (
    base: AdvanceStageTimelineEventBase,
    fromStage: ApplicationStage,
    targetStage: ApplicationStage,
  ): RecordTimelineEventArgs => ({
    ...base,
    type: TimelineEventType.STAGE_ADVANCED,
    fromStage,
    toStage: targetStage,
  }),
} as const;

export function buildAdvanceStageTimelineEventArgs({
  applicationId,
  staffPseudonymizedId,
  fromStage,
  targetStage,
  closedOutcome,
}: BuildAdvanceStageTimelineEventArgs): RecordTimelineEventArgs {
  const base: AdvanceStageTimelineEventBase = {
    applicationId,
    actor: {
      role: TimelineActorRole.STAFF,
      pseudonymizedId: staffPseudonymizedId,
    },
  };

  return targetStage === ApplicationStage.CLOSED
    ? ADVANCE_STAGE_TIMELINE_EVENT_BUILDERS.close(base, closedOutcome)
    : ADVANCE_STAGE_TIMELINE_EVENT_BUILDERS.advance(
        base,
        fromStage,
        targetStage,
      );
}
