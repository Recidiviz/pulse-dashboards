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

import * as Sentry from "@sentry/react-native";

import { useSnackbar } from "../../ui/Snackbar";

type SentryParams = {
  message: string;
  error: unknown;
  params?: object;
};

export const useErrorCapture = () => {
  const snackbar = useSnackbar();

  const captureError = ({ message, error, params }: SentryParams) => {
    Sentry.logger.error(message, {
      ...params,
      error: String(error),
    });
    if (error instanceof Error) {
      Sentry.captureException(error, { tags: { ...params } });
    }
  };

  const showError = (message: string, sentryParams: SentryParams) => {
    snackbar.showSnackbar(message);
    captureError(sentryParams);
  };

  return { showError, captureError };
};
