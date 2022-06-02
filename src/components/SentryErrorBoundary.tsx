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
import { BrowserTracing } from "@sentry/tracing";
import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";

import ErrorMessage from "./ErrorMessage";

interface Props {
  children: React.ReactElement;
  handleBeforeCapture?: (scope: Sentry.Scope) => void;
}

function SentryErrorBoundary({
  children,
  handleBeforeCapture,
}: Props): JSX.Element {
  const history = useHistory();
  useEffect(() => {
    Sentry.init({
      environment: process.env.REACT_APP_SENTRY_ENV,
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
        }),
      ],
      tracesSampleRate: 1,
      maxValueLength: 1000, // default is 250, this lets us see longer error messages
    });
  }, [history]);
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => <ErrorMessage error={error} />}
      beforeCapture={handleBeforeCapture}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

export default SentryErrorBoundary;
