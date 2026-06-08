// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import ErrorBoundary from "react-native-error-boundary";

import { Typography } from "~@meetings/app/shared/ui/Typography";

type FallbackProps = {
  error: Error;
  resetError: () => void;
};

const MyErrorFallback: React.FC<FallbackProps> = ({ resetError }) => (
  <View className="flex-1 items-center justify-center bg-white px-6">
    <Typography className="mb-5 text-4xl font-bold text-red-600">
      Oops!
    </Typography>
    <Typography className="mb-8 text-center text-base text-gray-600">
      There was an unexpected error. Please try again.
    </Typography>

    <TouchableOpacity
      className="mb-3 w-80 items-center self-center rounded-full bg-brand py-4"
      onPress={resetError}
    >
      <Typography className="text-lg font-semibold text-white">
        Back to Home
      </Typography>
    </TouchableOpacity>
  </View>
);

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  const [globalError, setGlobalError] = useState<Error | null>(null);

  useEffect(() => {
    const globalHandler = (error: Error, isFatal?: boolean) => {
      Sentry.captureException(error);
      if (isFatal) {
        setGlobalError(error);
      }
    };
    ErrorUtils.setGlobalHandler(globalHandler);
    return () => {
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        // No-op: This function intentionally does nothing as a cleanup mechanism.
      });
    };
  }, []);

  if (globalError) {
    return (
      <MyErrorFallback
        error={globalError}
        resetError={() => {
          setGlobalError(null);
        }}
      />
    );
  }
  return (
    <ErrorBoundary
      onError={(error) => Sentry.captureException(error)}
      FallbackComponent={MyErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
