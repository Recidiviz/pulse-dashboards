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

import React, { createContext, useContext, useEffect } from "react";

import { env } from "~@meetings/app/shared/config/env";
import { segmentClient } from "~@meetings/app/shared/lib/monitoring";

interface AnalyticsContextType {
  track: (eventName: string, metadata?: Record<string, unknown>) => void;
  screen: (screenName: string, metadata?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined,
);

const isAnalyticsEnabledForEnv = () =>
  ["staging", "production"].includes(env.EXPO_PUBLIC_DEPLOY_ENV);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  email?: string;
  isSkipAuthUser: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  email,
  isSkipAuthUser,
}) => {
  const recidivizEmail =
    email?.toLowerCase().includes("recidiviz.org") ||
    email?.toLowerCase().includes("recidiviz-test.org");
  const isInternalUser = isSkipAuthUser || recidivizEmail;

  const shouldWriteToSegment =
    isAnalyticsEnabledForEnv() &&
    (!isInternalUser || env.EXPO_PUBLIC_DEPLOY_ENV === "staging");

  const track = (eventName: string, metadata?: Record<string, unknown>) => {
    const fullMetadata = { ...metadata, isInternalUser };
    if (shouldWriteToSegment) {
      void segmentClient.track(`frontend_meetings_${eventName}`, fullMetadata);
    } else {
      console.log(
        `[Analytics] Tracking event: ${eventName}, metadata: ${JSON.stringify(fullMetadata)}`,
      );
    }
  };

  const screen = (screenName: string, metadata?: Record<string, unknown>) => {
    const fullMetadata = { ...metadata, isInternalUser };
    if (shouldWriteToSegment) {
      void segmentClient.screen(screenName, fullMetadata);
    } else {
      console.log(
        `[Analytics] Screen: ${screenName}, metadata: ${JSON.stringify(fullMetadata)}`,
      );
    }
  };

  useEffect(() => {
    if (email && !isSkipAuthUser) {
      if (shouldWriteToSegment) {
        void segmentClient.identify(email, { isInternalUser });
      } else {
        console.log(`[Analytics] Identifying user: ${email}`);
      }
    }
  }, [email, isInternalUser, isSkipAuthUser, shouldWriteToSegment]);

  return (
    <AnalyticsContext.Provider value={{ track, screen }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
};
