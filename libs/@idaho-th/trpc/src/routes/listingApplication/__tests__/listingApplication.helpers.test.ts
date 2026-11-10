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

import { describe, expect, it } from "vitest";

import { TimelineViewerRole } from "~@idaho-th/prisma/client";
import { APPLICATION_LAST_UPDATED_STATUS } from "~@idaho-th/shared";
import { TEST_STAFF_PSEUDONYMIZED_ID } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { deriveLastUpdatedStatus } from "../listingApplication.helpers";
import { buildStaffApplicationDashboardSelect } from "../listingApplication.selects";
import type { StaffDashboardViewer } from "../listingApplication.types";
import { seedDashboardApplication } from "./listingApplication.fixtures";

const viewer: StaffDashboardViewer = {
  role: TimelineViewerRole.CASE_MANAGER,
  pseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
};

const OTHER_ACTOR = "other-user";

/** Loads the row in the exact shape deriveLastUpdatedStatus is given. */
function readDashboardCore(applicationId: string) {
  return testPrismaClient.housingApplication.findUniqueOrThrow({
    where: { id: applicationId },
    select: buildStaffApplicationDashboardSelect(viewer),
  });
}

async function seedCore(options: {
  lastOpenedModalAt?: Date;
  latestOtherEventAt?: Date;
  lastActivityAt: Date;
  eventActorPseudonymizedId?: string;
}) {
  const { application } = await seedDashboardApplication(testPrismaClient, {
    lastActivityAt: options.lastActivityAt,
    ...(options.lastOpenedModalAt
      ? { staffReadState: { lastOpenedModalAt: options.lastOpenedModalAt } }
      : {}),
    timelineEvents: options.latestOtherEventAt
      ? [
          {
            actorPseudonymizedId:
              options.eventActorPseudonymizedId ?? OTHER_ACTOR,
            createdAt: options.latestOtherEventAt,
          },
        ]
      : [],
  });

  return readDashboardCore(application.id);
}

describe("deriveLastUpdatedStatus", () => {
  const now = new Date("2026-07-06T12:00:00.000Z");

  it("marks New Updates when the viewer never opened the modal and another user acted", async () => {
    const core = await seedCore({
      latestOtherEventAt: new Date("2026-07-05T00:00:00.000Z"),
      lastActivityAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
    );
  });

  it("marks New Updates when another user acted after the viewer last opened the modal", async () => {
    const core = await seedCore({
      lastOpenedModalAt: new Date("2026-07-01T00:00:00.000Z"),
      latestOtherEventAt: new Date("2026-07-04T00:00:00.000Z"),
      lastActivityAt: new Date("2026-07-04T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
    );
  });

  it("returns null when the latest other event is older than the last modal open and activity is fresh", async () => {
    const core = await seedCore({
      lastOpenedModalAt: new Date("2026-07-05T00:00:00.000Z"),
      latestOtherEventAt: new Date("2026-07-01T00:00:00.000Z"),
      lastActivityAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBeNull();
  });

  it("ignores the viewer's own events — the query excludes them", async () => {
    const core = await seedCore({
      latestOtherEventAt: new Date("2026-07-05T00:00:00.000Z"),
      eventActorPseudonymizedId: viewer.pseudonymizedId,
      lastActivityAt: new Date("2026-07-05T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBeNull();
  });

  it("marks No Updates (30d) when there are no new events and activity is stale", async () => {
    const core = await seedCore({
      lastOpenedModalAt: new Date("2026-05-01T00:00:00.000Z"),
      latestOtherEventAt: new Date("2026-05-01T00:00:00.000Z"),
      lastActivityAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NO_UPDATES_30D,
    );
  });

  it("prefers New Updates over the stale-activity label", async () => {
    const core = await seedCore({
      latestOtherEventAt: new Date("2026-07-05T00:00:00.000Z"),
      lastActivityAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(deriveLastUpdatedStatus(core, now)).toBe(
      APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES,
    );
  });
});
