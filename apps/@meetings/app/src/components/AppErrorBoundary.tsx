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
import { Text, TouchableOpacity, View } from "react-native";
import ErrorBoundary from "react-native-error-boundary";

type FallbackProps = {
  error: Error;
  resetError: () => void;
};

const MyErrorFallback: React.FC<FallbackProps> = ({ resetError }) => (
  <View className="flex-1 items-center justify-center bg-white px-6">
    <Text className="mb-5 font-inter text-4xl font-bold text-red-600">
      Oops!
    </Text>
    <Text className="mb-8 text-center font-inter text-base text-gray-600">
      There was an unexpected error. Please try again.
    </Text>

    <TouchableOpacity
      className="mb-3 w-80 items-center self-center rounded-full bg-[#006C67] py-4"
      onPress={resetError}
    >
      <Text className="font-inter text-lg font-semibold text-white">
        Back to Home
      </Text>
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
