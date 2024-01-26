// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { Debug } from "@sentry/integrations";
import * as Sentry from "@sentry/react";
import React, { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

import ErrorMessage from "./ErrorMessage";

interface Props {
  children: React.ReactElement;
  handleBeforeCapture?: (scope: Sentry.Scope) => void;
}

/**
 * `True` for any non-`production` environment (i.e. `dev`, `staging`, etc.).
 */
const IS_DEBUG = process.env.REACT_APP_DEPLOY_ENV
  ? !["production", "demo"].includes(process.env.REACT_APP_DEPLOY_ENV)
  : false;

// SENTRY INTEGRATIONS
const BROWSER_TRACING_INTEGRATION = new Sentry.BrowserTracing({
  // See docs for support of different versions of variation of react router
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
  routingInstrumentation: Sentry.reactRouterV6Instrumentation(
    React.useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes
  ),
});

function SentryErrorBoundary({
  children,
  handleBeforeCapture,
}: Props): JSX.Element {
  const navigate = useNavigate();
  useEffect(() => {
    Sentry.init({
      environment: process.env.REACT_APP_SENTRY_ENV,
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new Debug(), BROWSER_TRACING_INTEGRATION],
      beforeSend: (event, hint) => {
        // only works if `Debug` integration is enabled.
        // https://docs.sentry.io/platforms/javascript/configuration/integrations/debug/?original_referrer=https://www.google.com/
        if (IS_DEBUG)
          console.error(hint.originalException || hint.syntheticException); // log the error in the console.
        return event; // send the error to sentry
      },
      tracesSampleRate: 1,
      maxValueLength: 1000, // default is 250, this lets us see longer error messages
    });
  }, [navigate]);
  return (
    <Sentry.ErrorBoundary
      fallback={ErrorMessage}
      beforeCapture={handleBeforeCapture}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

export default SentryErrorBoundary;
