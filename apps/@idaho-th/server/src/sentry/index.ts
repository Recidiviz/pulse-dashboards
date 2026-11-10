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

import { init, prismaIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { classifyTrpcError, ERROR_KIND } from "~observability";

import { sanitizeSentryBreadcrumb, sanitizeSentryEvent } from "./sanitizeEvent";

init({
  dsn: process.env["SENTRY_DSN"],
  environment: process.env["SENTRY_ENV"],
  tracesSampleRate: 0,
  profilesSampleRate: 0,
  sendDefaultPii: false,
  integrations: [nodeProfilingIntegration(), prismaIntegration()],
  maxValueLength: 5000,
  beforeSend(event, hint) {
    // hint.originalException is the raw thrown value, not the normalized
    // event — it still carries the TRPCError's .code, which the event itself
    // never gets (Sentry's trpcMiddleware doesn't attach it anywhere).
    const { kind, code, httpStatus } = classifyTrpcError(
      hint.originalException,
    );
    if (kind === ERROR_KIND.EXPECTED) {
      // Client-facing outcome (bad input, wrong role, not found, etc.), not a
      // server bug. Still visible via the "expected tRPC error" log line.
      return null;
    }

    const sanitized = sanitizeSentryEvent(event);
    if (code) {
      sanitized.tags = {
        ...sanitized.tags,
        "trpc.code": code,
        "trpc.http_status": String(httpStatus),
      };
    }
    return sanitized;
  },
  beforeBreadcrumb(breadcrumb) {
    return sanitizeSentryBreadcrumb(breadcrumb);
  },
});
