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

import { ApplicationStage, TimelineEventType } from "~@idaho-th/prisma/client";

// Single source of truth for "this provider's application is closed without
// having won a home plan" — shared by both the timeline and documents
// features, which each need to know when a declined/not-selected provider
// lost access.
export const PROVIDER_CLOSED_EVENT_TYPES = [
  TimelineEventType.PROVIDER_DECLINED,
  TimelineEventType.PROVIDER_NOT_SELECTED,
  TimelineEventType.PROVIDER_CANCELED,
  TimelineEventType.PROVIDER_REVOKED_CONDITIONAL_APPROVAL,
] as const;

const PROVIDER_CLOSED_EVENT_TYPE_SET = new Set<TimelineEventType>(
  PROVIDER_CLOSED_EVENT_TYPES,
);

export function findProviderClosedEventAt(
  events: ReadonlyArray<{
    eventType: TimelineEventType;
    scopedProviderId: string | null;
    createdAt: Date;
  }>,
  providerId: string,
): Date | null {
  // A provider can close more than once (revoke, re-approve, then decline), and
  // callers pass events in different orders, so take the latest match.
  let latestClosedAt: Date | null = null;
  for (const event of events) {
    const isClosedForProvider =
      PROVIDER_CLOSED_EVENT_TYPE_SET.has(event.eventType) &&
      event.scopedProviderId === providerId;
    if (
      isClosedForProvider &&
      (latestClosedAt == null || event.createdAt > latestClosedAt)
    ) {
      latestClosedAt = event.createdAt;
    }
  }
  return latestClosedAt;
}

export function resolveClosedProviderCutoff(
  stage: ApplicationStage,
  providerClosedEventAt: Date | null,
): Date | null {
  if (stage !== ApplicationStage.CLOSED) {
    return null;
  }
  return providerClosedEventAt;
}

// Shared by isEventVisibleForCutoff (timeline.helpers.ts) and
// isDocumentVisibleForCutoff (documents.helpers.ts) so the two features can't
// silently diverge on cutoff semantics. A record scoped to the provider
// itself is always visible; everything else must have been created strictly
// before the provider's own closed event.
export function isVisibleForCutoff(
  createdAt: Date,
  isOwnScoped: boolean,
  cutoff: Date | null,
): boolean {
  if (isOwnScoped || cutoff == null) {
    return true;
  }
  return createdAt < cutoff;
}
