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

import { beforeEach, describe, expect, it } from "vitest";

import { type Prisma, TimelineEventType } from "~@idaho-th/prisma/client";
import { createHousingApplicationTimelineEvent } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  isApplicationSentEventVisibleToProvider,
  isEventVisibleForCutoff,
  isEventVisibleToProvider,
} from "../timeline.helpers";
import { TIMELINE_EVENT_SELECT } from "../timeline.selects";
import { seedTimelineApplication } from "./timeline.fixtures";

/**
 * A seeded application with two providers. The predicates under test read the
 * same row shape the timeline query selects, so every event goes through the
 * database rather than being hand-built.
 */
let applicationId: string;
let providerA: string;
let providerB: string;

beforeEach(async () => {
  const { application, providers } = await seedTimelineApplication(
    testPrismaClient,
    { providers: [{ name: "Alpha Housing" }, { name: "Beta Housing" }] },
  );

  applicationId = application.id;
  providerA = providers[0].provider.id;
  providerB = providers[1].provider.id;
});

async function seedEvent(overrides: {
  eventType?: TimelineEventType;
  scopedProviderId?: string | null;
  cmOnly?: boolean;
  metadata?: Prisma.InputJsonValue;
  createdAt?: Date;
}) {
  const { id } = await createHousingApplicationTimelineEvent(testPrismaClient, {
    applicationId,
    ...overrides,
  });

  return testPrismaClient.housingApplicationTimelineEvent.findUniqueOrThrow({
    where: { id },
    select: TIMELINE_EVENT_SELECT,
  });
}

describe("isEventVisibleToProvider", () => {
  it("hides cmOnly events from providers", async () => {
    const event = await seedEvent({ scopedProviderId: null, cmOnly: true });

    expect(isEventVisibleToProvider(event, providerA)).toBe(false);
  });

  it("shows unscoped events and events scoped to this provider", async () => {
    const unscoped = await seedEvent({ scopedProviderId: null });
    const own = await seedEvent({ scopedProviderId: providerA });

    expect(isEventVisibleToProvider(unscoped, providerA)).toBe(true);
    expect(isEventVisibleToProvider(own, providerA)).toBe(true);
  });

  it("hides events scoped to another provider", async () => {
    const event = await seedEvent({ scopedProviderId: providerB });

    expect(isEventVisibleToProvider(event, providerA)).toBe(false);
  });
});

describe("isApplicationSentEventVisibleToProvider", () => {
  it("passes through non-sent event types", async () => {
    const event = await seedEvent({
      eventType: TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
    });

    expect(isApplicationSentEventVisibleToProvider(event, providerA)).toBe(
      true,
    );
  });

  it("shows APPLICATION_SENT only when metadata includes this provider", async () => {
    const includesProvider = await seedEvent({
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: { providerIds: [providerA, providerB] },
    });
    const excludesProvider = await seedEvent({
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: { providerIds: [providerB] },
    });

    expect(
      isApplicationSentEventVisibleToProvider(includesProvider, providerA),
    ).toBe(true);
    expect(
      isApplicationSentEventVisibleToProvider(excludesProvider, providerA),
    ).toBe(false);
  });

  it("hides APPLICATION_SENT when providerIds is missing or not an array", async () => {
    const noMetadata = await seedEvent({
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
    });
    const emptyMetadata = await seedEvent({
      eventType: TimelineEventType.APPLICATION_SENT_TO_PROVIDERS,
      metadata: {},
    });

    expect(isApplicationSentEventVisibleToProvider(noMetadata, providerA)).toBe(
      false,
    );
    expect(
      isApplicationSentEventVisibleToProvider(emptyMetadata, providerA),
    ).toBe(false);
  });
});

describe("isEventVisibleForCutoff", () => {
  const cutoff = new Date("2026-06-20T12:00:00.000Z");

  it("always shows the provider's own scoped events after they are closed", async () => {
    const event = await seedEvent({
      scopedProviderId: providerA,
      createdAt: new Date("2026-06-21T00:00:00.000Z"),
    });

    expect(isEventVisibleForCutoff(event, providerA, cutoff)).toBe(true);
  });

  it("hides shared events created at or after the provider closed cutoff", async () => {
    const atCutoff = await seedEvent({
      scopedProviderId: null,
      createdAt: cutoff,
    });
    const beforeCutoff = await seedEvent({
      scopedProviderId: null,
      createdAt: new Date("2026-06-19T00:00:00.000Z"),
    });

    expect(isEventVisibleForCutoff(atCutoff, providerA, cutoff)).toBe(false);
    expect(isEventVisibleForCutoff(beforeCutoff, providerA, cutoff)).toBe(true);
  });

  it("shows everything when the provider has no cutoff", async () => {
    const event = await seedEvent({
      scopedProviderId: null,
      createdAt: new Date("2026-06-21T00:00:00.000Z"),
    });

    expect(isEventVisibleForCutoff(event, providerA, null)).toBe(true);
  });
});
