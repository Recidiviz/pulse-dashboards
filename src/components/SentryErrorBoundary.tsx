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

function SentryErrorBoundary({
  children,
  handleBeforeCapture,
}: Props): JSX.Element {
  const navigate = useNavigate();
  useEffect(() => {
    Sentry.init({
      environment: process.env.REACT_APP_SENTRY_ENV,
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
      ],
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
