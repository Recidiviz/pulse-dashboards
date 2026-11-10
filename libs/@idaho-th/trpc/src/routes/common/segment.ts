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

import { Analytics } from "@segment/analytics-node";
import { captureException } from "@sentry/node";

import type {
  Prisma,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";
import { serverConfig } from "~@idaho-th/trpc/routes/common/serverConfig";

type EventName =
  | "backend_idaho_th_application_scan_completed"
  | "backend_idaho_th_housing_application_timeline_event"
  | "backend_idaho_th_application_override_recorded";

type ApplicationScanCompletedProperties = {
  applicationId?: string;
  success: boolean;
  failureReason?: string;
  elapsedMs: number;
  staffPseudonymizedId: string;
};

// Mirrors a HousingApplicationTimelineEvent row -- emitted once for every
// TimelineEventType by the single recordTimelineEvent() choke point, so this
// is the admin panel's one source of truth for application/stage/provider
// lifecycle metrics. `metadata` here must already be redacted of any PII
// (e.g. fileName, expectedReleaseDate) by the caller -- see
// analyticsMetadata() in timeline.events.ts -- never forward the raw DB
// metadata wholesale.
export type HousingApplicationTimelineEventProperties = {
  applicationId: string;
  eventType: TimelineEventType;
  actorRole: TimelineActorRole;
  // The actor who performed this event, regardless of role (STAFF, PROVIDER,
  // or null for SYSTEM) -- the sole source of this event's Segment `userId`.
  // Do not add a separate staff-only id field here: that would mislabel
  // provider actors as staff in the tracked properties.
  actorPseudonymizedId: string | null;
  scopedProviderId: string | null;
  cmOnly: boolean;
  metadata?: Prisma.InputJsonValue;
};

type ApplicationOverrideRecordedProperties = {
  applicationId: string;
  overriddenFieldCount: number;
  staffPseudonymizedId: string;
};

type EventProperties =
  | ApplicationScanCompletedProperties
  | HousingApplicationTimelineEventProperties
  | ApplicationOverrideRecordedProperties;

// Segment requires either a userId or an anonymousId on every call. Events
// with no real actor to attribute to (SYSTEM-initiated timeline events like
// STAGE_ADVANCED) would otherwise get a fresh random anonymousId every call,
// which both inflates Segment's Monthly Tracked Users (each one counts as a
// distinct "user") and makes these events impossible to group. Using one
// fixed id for all of them avoids both.
const SYSTEM_ACTOR_ANONYMOUS_ID = "idaho-th-system";

function resolveUserId(properties: EventProperties): string | undefined {
  if ("actorPseudonymizedId" in properties) {
    return properties.actorPseudonymizedId ?? undefined;
  }
  return properties.staffPseudonymizedId;
}

// The SDK's default (1.25x its 10s flush interval) doesn't fit in Cloud Run's
// 10s SIGTERM window.
export const SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS = 2000;

class SegmentClient {
  private analytics?: Analytics;
  private initialized = false;
  private closing?: Promise<void>;

  // Built on first track(), not at import: processes that only import this
  // transitively (e.g. the document-janitor job, which is deliberately not
  // given SEGMENT_WRITE_KEY) should not report a missing key.
  private getAnalytics(): Analytics | undefined {
    if (this.initialized) return this.analytics;
    this.initialized = true;

    const writeKey = getOptionalEnv("SEGMENT_WRITE_KEY");

    if (writeKey) {
      this.analytics = new Analytics({ writeKey });
      this.analytics.on("error", (e) => captureException(e));
    } else if (!serverConfig.isDevelopment) {
      captureException("SEGMENT_WRITE_KEY missing from environment");
    }
    return this.analytics;
  }

  track(
    event: "backend_idaho_th_application_scan_completed",
    properties: ApplicationScanCompletedProperties,
  ): void;

  track(
    event: "backend_idaho_th_housing_application_timeline_event",
    properties: HousingApplicationTimelineEventProperties,
  ): void;

  track(
    event: "backend_idaho_th_application_override_recorded",
    properties: ApplicationOverrideRecordedProperties,
  ): void;

  track(event: EventName, properties: EventProperties): void {
    const analytics = this.getAnalytics();
    if (analytics) {
      const userId = resolveUserId(properties);
      analytics.track({
        event,
        ...(userId ? { userId } : { anonymousId: SYSTEM_ACTOR_ANONYMOUS_ID }),
        properties,
      });
    } else if (serverConfig.isDevelopment) {
      console.log(
        `[Analytics] Tracking ${event} with data ${JSON.stringify(properties)}`,
      );
    }
    // In production with a missing SEGMENT_WRITE_KEY, that was already
    // reported to Sentry once in getAnalytics() -- don't also log every
    // event's (potentially PII-bearing) properties to stdout/Cloud Logging.
  }

  /**
   * Flushes and closes the underlying Segment client. Call this only on
   * process shutdown (the `onClose` hook and the signal handler share one
   * flush) -- never per-event: the SDK's own `flush()` guards against
   * overlapping calls by warning and no-op'ing, so calling it after every
   * track() would routinely collide under concurrent requests and leave
   * those events waiting for the normal batch timer anyway, defeating the
   * point.
   */
  async closeAndFlush(
    timeoutMs = SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS,
  ): Promise<void> {
    if (!this.analytics) return;
    this.closing ??= this.analytics.closeAndFlush({ timeout: timeoutMs });
    return this.closing;
  }
}

// a single global instance should be fine, no need to keep reinitializing the SDK
export const segment = new SegmentClient();
