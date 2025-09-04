// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
  BrowserOptions,
  BrowserTracing,
  init,
  reactRouterV6Instrumentation,
} from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import { proxyHost } from "../../utils/proxy";

/**
 * Initializes Sentry globally in the browser. Sentry init depends on two environment variables,
 * VITE_SENTRY_DSN and VITE_SENTRY_ENV. If VITE_SENTRY_DSN is missing, Sentry will operate in
 * "offline mode" (captured items will not be sent to Sentry, but they will be logged to the console).
 */
export function initializeSentry(): void {
  const dsn = import.meta.env["VITE_SENTRY_DSN"];
  const environment = import.meta.env["VITE_SENTRY_ENV"] ?? "development";

  const isOffline = !dsn;

  const integrations: BrowserOptions["integrations"] = [
    new BrowserTracing({
      // See docs for support of different versions of variation of react router
      // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
      routingInstrumentation: reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      ),
    }),
  ];

  const beforeSend: BrowserOptions["beforeSend"] = (event, hint) => {
    // log errors to console outside of production
    if (environment !== "production") {
      console.error(hint.originalException || hint.syntheticException);
    }

    if (isOffline) {
      // returning null prevents the event from being buffered forever in offline mode
      return null;
    }

    // returning the event means Sentry will proceed with sending it
    return event;
  };

  const reverseProxyHost = proxyHost();

  init({
    dsn,
    environment,
    integrations,
    beforeSend,
    tracesSampleRate: isOffline ? 0 : 1,
    ...(reverseProxyHost
      ? {
          tunnel: `https://${reverseProxyHost}/sentry/`,
        }
      : {}),
  });
}
