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

import { ApplicationStage, TimelineEventType } from "~@idaho-th/prisma/client";

import {
  findProviderClosedEventAt,
  isVisibleForCutoff,
  resolveClosedProviderCutoff,
} from "../providerVisibility";

const providerId = "provider-id-1";

describe("resolveClosedProviderCutoff", () => {
  it("returns null for the winning provider (no closed event of their own)", () => {
    expect(
      resolveClosedProviderCutoff(ApplicationStage.CLOSED, null),
    ).toBeNull();
  });

  it("returns null for an active provider even with a closed-event timestamp", () => {
    const closedAt = new Date("2026-06-20T00:00:00.000Z");
    expect(
      resolveClosedProviderCutoff(ApplicationStage.APPROVALS, closedAt),
    ).toBeNull();
  });

  it("returns when the provider's own application closed (declined/not-selected)", () => {
    const closedAt = new Date("2026-06-20T00:00:00.000Z");
    expect(
      resolveClosedProviderCutoff(ApplicationStage.CLOSED, closedAt),
    ).toEqual(closedAt);
  });
});

describe("findProviderClosedEventAt", () => {
  it("returns the createdAt of this provider's PROVIDER_DECLINED event", () => {
    const closedAt = new Date("2026-06-20T00:00:00.000Z");
    expect(
      findProviderClosedEventAt(
        [
          {
            eventType: TimelineEventType.PROVIDER_DECLINED,
            scopedProviderId: "some-other-provider",
            createdAt: new Date(),
          },
          {
            eventType: TimelineEventType.PROVIDER_DECLINED,
            scopedProviderId: providerId,
            createdAt: closedAt,
          },
        ],
        providerId,
      ),
    ).toEqual(closedAt);
  });

  it("returns the createdAt of this provider's PROVIDER_NOT_SELECTED event", () => {
    const closedAt = new Date("2026-06-20T00:00:00.000Z");
    expect(
      findProviderClosedEventAt(
        [
          {
            eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
            scopedProviderId: providerId,
            createdAt: closedAt,
          },
        ],
        providerId,
      ),
    ).toEqual(closedAt);
  });

  it("returns the createdAt of this provider's PROVIDER_CANCELED event", () => {
    const closedAt = new Date("2026-06-20T00:00:00.000Z");
    expect(
      findProviderClosedEventAt(
        [
          {
            eventType: TimelineEventType.PROVIDER_CANCELED,
            scopedProviderId: providerId,
            createdAt: closedAt,
          },
        ],
        providerId,
      ),
    ).toEqual(closedAt);
  });

  it("ignores events scoped to this provider that aren't a closing event", () => {
    expect(
      findProviderClosedEventAt(
        [
          {
            eventType: TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
            scopedProviderId: providerId,
            createdAt: new Date(),
          },
        ],
        providerId,
      ),
    ).toBeNull();
  });

  it("returns null when no closed event is scoped to this provider", () => {
    expect(
      findProviderClosedEventAt(
        [
          {
            eventType: TimelineEventType.PROVIDER_DECLINED,
            scopedProviderId: "some-other-provider",
            createdAt: new Date(),
          },
        ],
        providerId,
      ),
    ).toBeNull();
  });

  it("returns null when there are no events", () => {
    expect(findProviderClosedEventAt([], providerId)).toBeNull();
  });
});

describe("findProviderClosedEventAt with several closing events", () => {
  const revokedAt = new Date("2026-06-20T00:00:00.000Z");
  const declinedAt = new Date("2026-06-25T00:00:00.000Z");
  // Revoke, then re-approve (not a closing event), then decline.
  const events = [
    {
      eventType: TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
      scopedProviderId: providerId,
      createdAt: revokedAt,
    },
    {
      eventType: TimelineEventType.PROVIDER_CONDITIONALLY_APPROVED,
      scopedProviderId: providerId,
      createdAt: new Date("2026-06-22T00:00:00.000Z"),
    },
    {
      eventType: TimelineEventType.PROVIDER_DECLINED,
      scopedProviderId: providerId,
      createdAt: declinedAt,
    },
  ];

  it("treats a revoke as a closing event", () => {
    expect(findProviderClosedEventAt([events[0]], providerId)).toEqual(
      revokedAt,
    );
  });

  it("picks the latest closing event when given oldest first", () => {
    expect(findProviderClosedEventAt(events, providerId)).toEqual(declinedAt);
  });

  it("picks the latest closing event when given newest first", () => {
    expect(
      findProviderClosedEventAt([...events].reverse(), providerId),
    ).toEqual(declinedAt);
  });
});

describe("isVisibleForCutoff", () => {
  const cutoff = new Date("2026-06-20T12:00:00.000Z");

  it("returns true when there is no cutoff", () => {
    expect(
      isVisibleForCutoff(new Date("2026-06-21T00:00:00.000Z"), false, null),
    ).toBe(true);
  });

  it("always returns true for the provider's own scoped records", () => {
    expect(
      isVisibleForCutoff(new Date("2026-06-21T00:00:00.000Z"), true, cutoff),
    ).toBe(true);
  });

  it("requires shared records to be created strictly before the cutoff", () => {
    expect(
      isVisibleForCutoff(new Date("2026-06-19T00:00:00.000Z"), false, cutoff),
    ).toBe(true);
    expect(isVisibleForCutoff(cutoff, false, cutoff)).toBe(false);
    expect(
      isVisibleForCutoff(new Date("2026-06-21T00:00:00.000Z"), false, cutoff),
    ).toBe(false);
  });
});
