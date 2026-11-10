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
  type Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";

type HousingApplicationTimelineEventInput = Pick<
  Prisma.HousingApplicationTimelineEventUncheckedCreateInput,
  "applicationId"
> &
  Partial<Prisma.HousingApplicationTimelineEventUncheckedCreateInput>;

/**
 * Writes a timeline event directly, bypassing recordTimelineEvent. Tests that
 * need a provider's visibility cutoff (a PROVIDER_DECLINED /
 * PROVIDER_NOT_SELECTED event at a specific `createdAt`) use this; tests
 * asserting on events a service emitted should read them back instead.
 */
export function createHousingApplicationTimelineEvent(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: HousingApplicationTimelineEventInput,
) {
  return prismaClient.housingApplicationTimelineEvent.create({
    data: {
      applicationId,
      eventType: TimelineEventType.APPLICATION_CREATED,
      description: "Application created for client",
      actorRole: TimelineActorRole.SYSTEM,
      ...overrides,
    },
  });
}
