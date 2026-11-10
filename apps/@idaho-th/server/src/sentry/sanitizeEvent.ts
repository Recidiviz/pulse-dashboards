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

import type { Breadcrumb, ErrorEvent } from "@sentry/node";

import { scrubErrorText } from "~@idaho-th/trpc/utils/errorText";

/**
 * tRPC query procedures encode their input directly in the URL's query
 * string, so a captured URL must have it stripped before leaving the process.
 */
function stripQueryString(url: string): string {
  // `split` always yields at least one element, so the `?? url` arm is
  // unreachable — it is here only to satisfy noUncheckedIndexedAccess, and is
  // ignored so it can't hold branch coverage below 100% forever.
  /* v8 ignore next */
  return url.split("?")[0] ?? url;
}

/**
 * Request headers kept on Sentry events. Everything else — including any
 * header added by a future change — is dropped by default, not by name.
 */
const ALLOWED_REQUEST_HEADER_NAMES = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "connection",
  "content-type",
  "host",
  "origin",
  "referer",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "user-agent",
]);

/**
 * Strip housing/PDF-adjacent request and identity fields from Sentry events.
 * Exception type, stack, environment, and safe route metadata are kept.
 *
 * Request and user data are rebuilt field-by-field from an explicit allowlist
 * (method, url, a fixed header set, user id), so any field not named here is
 * dropped regardless of what the SDK populates. Returns a new object; the
 * input event is not modified.
 *
 * Every call site is still expected to keep its error message free of
 * recipient PII itself; see the "message stays ours end to end" convention in
 * libs/@idaho-th/trpc/src/intercom/intercom.http.ts:269. The scrub below is a
 * backstop for the sites that don't, not a substitute for that discipline.
 */
export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  const sanitized: ErrorEvent = { ...event };

  if (sanitized.exception?.values) {
    sanitized.exception = {
      ...sanitized.exception,
      values: sanitized.exception.values
        // A ZodError's message embeds the values it rejected, which
        // scrubErrorText cannot recognise.
        .filter((value) => value.type !== "ZodError")
        .map((value) =>
          value.value === undefined
            ? value
            : { ...value, value: scrubErrorText(value.value) },
        ),
    };
  }

  if (sanitized.message !== undefined) {
    sanitized.message = scrubErrorText(sanitized.message);
  }

  if (sanitized.request) {
    const { method, url, headers } = sanitized.request;

    sanitized.request = {
      ...(method === undefined ? {} : { method }),
      ...(url === undefined ? {} : { url: stripQueryString(url) }),
      ...(headers === undefined
        ? {}
        : {
            headers: Object.fromEntries(
              Object.entries(headers)
                .filter(([key]) =>
                  ALLOWED_REQUEST_HEADER_NAMES.has(key.toLowerCase()),
                )
                .map(([key, value]) =>
                  key.toLowerCase() === "referer" && typeof value === "string"
                    ? [key, stripQueryString(value)]
                    : [key, value],
                ),
            ),
          }),
    };
  }

  if (sanitized.user) {
    sanitized.user =
      sanitized.user.id === undefined ? {} : { id: sanitized.user.id };
  }

  if (sanitized.contexts?.["trpc"]) {
    const trpcContext = { ...sanitized.contexts["trpc"] };
    delete trpcContext["input"];
    sanitized.contexts = {
      ...sanitized.contexts,
      trpc: trpcContext,
    };
  }

  return sanitized;
}

/**
 * Breadcrumb data fields kept for non-console breadcrumbs (e.g. http/fetch
 * breadcrumbs). Everything else — including any field a future integration
 * starts populating — is dropped by default, not by name.
 */
const ALLOWED_BREADCRUMB_DATA_KEYS = new Set([
  "url",
  "method",
  "status_code",
  "reason",
]);

/**
 * Drop console breadcrumb payloads that can carry tRPC/Zod dumps with PII.
 * Keep the breadcrumb category/level so we still see that console noise occurred.
 */
export function sanitizeSentryBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
  if (breadcrumb.category === "console") {
    return {
      ...breadcrumb,
      message: breadcrumb.message ? "[console output redacted]" : undefined,
      data: undefined,
    };
  }

  if (breadcrumb.data) {
    const data = Object.fromEntries(
      Object.entries(breadcrumb.data).filter(([key]) =>
        ALLOWED_BREADCRUMB_DATA_KEYS.has(key),
      ),
    );
    if (typeof data["url"] === "string") {
      data["url"] = stripQueryString(data["url"]);
    }
    breadcrumb = { ...breadcrumb, data };
  }

  return breadcrumb;
}
