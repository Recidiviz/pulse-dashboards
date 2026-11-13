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
  AnalyticsBrowser,
  type MiddlewareFunction,
} from "@segment/analytics-next";

/** Counts page views of Colorado's Parole Board public calendar. */
export interface PageCounts {
  /** Sends one page event naming month, such as "2026-11", or null. */
  page(month: string | null): void;
}

/**
 * The anonymousId on every event. Segment drops an event with neither a
 * userId nor an anonymousId, so each one carries this constant, which is the
 * same for every visitor and identifies no one.
 */
export const PAGE_COUNT_ANONYMOUS_ID = "us-co-public-calendar-visitor";

/**
 * Segment records the IP address the request came from unless the event
 * names one; this placeholder stops it recording the visitor's.
 */
export const PAGE_COUNT_IP = "0.0.0.0";

/**
 * Cuts each event down to a page count: the month, the constant anonymousId
 * and the placeholder IP. It drops the page URL, referrer, title, user agent,
 * campaign and any userId that analytics.js adds.
 */
export const stripToPageCount: MiddlewareFunction = ({ payload, next }) => {
  const event = payload.obj;
  const month: unknown = event.properties?.["month"];
  event.anonymousId = PAGE_COUNT_ANONYMOUS_ID;
  delete event.userId;
  delete event.traits;
  event.properties = { month: typeof month === "string" ? month : null };
  event.context = { ip: PAGE_COUNT_IP, library: event.context?.library };
  next(payload);
};

/**
 * Builds the page counter. With a Segment write key it loads analytics.js
 * with nothing stored on the device (no cookies or local storage), sends
 * events to Segment only, never to the destinations a Segment source can fan
 * out to in the browser, and strips each event to a page count. Without a key
 * it sends nothing.
 */
export function createPageCounts(writeKey: string | undefined): PageCounts {
  if (!writeKey) return { page: () => undefined };
  const analytics = AnalyticsBrowser.load(
    { writeKey },
    {
      disableClientPersistence: true,
      initialPageview: false,
      integrations: { All: false, "Segment.io": true },
    },
  );
  void analytics.addSourceMiddleware(stripToPageCount);
  return {
    page: (month) => {
      void analytics.page({ month });
    },
  };
}
