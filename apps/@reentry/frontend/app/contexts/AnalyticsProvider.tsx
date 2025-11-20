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

"use client";

import { captureException } from "@sentry/nextjs";
import { createContext, ReactNode, useContext, useEffect } from "react";

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { analytics } from "~@reentry/frontend/lib/segment";
import { IntakeAnalytics } from "~@reentry/frontend-shared";

// Types
interface AnalyticsContextProps extends IntakeAnalytics {
  identify: (userId: string) => void;
  pageView: (pagePath: string) => void;
  track: (eventName: string, metadata: Record<string, unknown>) => void;
  trackClientIntakeChatHistoryViewed: (metadata: {
    justiceInvolvedPersonId: string;
    section: string;
  }) => void;
  trackClientIntakeManuallyEnabled: (metadata: {
    justiceInvolvedPersonId: string;
  }) => void;
  trackClientHomeAddressSubmitted: (metadata: {
    justiceInvolvedPersonId: string;
  }) => void;
  trackAssessmentRecordingStatusUpdated: (metadata: {
    justiceInvolvedPersonId: string;
    sessionId: string;
    status: string;
  }) => void;
}

interface AnalyticsProviderProps {
  writeKey?: string;
  children: ReactNode;
}

// Set up the global context and expose a function called pageView that
// can be used when importing this context.
const AnalyticsContext = createContext<AnalyticsContextProps | null>(null);

// Disable analytics in any environment outside of staging and production
// However, there is a source set up for development, so you can comment out the
// shouldSkipWriteToSegment call in the track(), etc methods to emit events in dev
const isAnalyticsDisabled = !["staging", "production"].includes(
  process.env["NEXT_PUBLIC_ENVIRONMENT"] || "development",
);

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const auth = useAuth();

  const isInternalUser = () => {
    if (auth.authStore && auth.authStore.user && auth.authStore.user.email) {
      const userEmail = auth.authStore.user.email.toLowerCase();
      return (
        userEmail.includes("recidiviz.org") ||
        userEmail.includes("recidiviz-test.org") ||
        userEmail.includes("monadical.com")
      );
    }

    captureException(
      `Could not determine if user ${auth.userAppMetadata?.pseudonymizedId} is an internal user`,
    );
    return;
  };

  const shouldSkipWriteToSegment = () => {
    return (
      isAnalyticsDisabled ||
      (isInternalUser() && process.env["NEXT_PUBLIC_ENVIRONMENT"] !== "staging")
    );
  };

  const shouldLogEvent = () => {
    return isAnalyticsDisabled || isInternalUser();
  };

  const defaultEventProperties = {
    isInternalUser: isInternalUser(),
  };

  const identify = (userId: string) => {
    const fullMetadata = { ...defaultEventProperties };
    if (shouldLogEvent()) {
      console.log(`[Analytics] Identifying user: ${userId}`);
    }
    if (shouldSkipWriteToSegment()) return;
    analytics.identify(userId, fullMetadata);
  };

  const pageView = (pagePath: string) => {
    const fullMetadata = { ...defaultEventProperties };
    if (shouldLogEvent()) {
      console.log(`[Analytics] Tracking pageview: ${pagePath}`);
    }
    if (shouldSkipWriteToSegment()) return;
    analytics.page(pagePath, fullMetadata);
  };

  const track = (eventName: string, metadata?: Record<string, unknown>) => {
    // If the event is from a public route, e.g. `/assessments`, consider using
    // the below trackIntakeChatEvent() instead.
    const fullMetadata = { ...metadata, ...defaultEventProperties };
    if (shouldLogEvent()) {
      console.log(
        `[Analytics] Tracking event name: ${eventName}, with metadata: ${JSON.stringify(fullMetadata)}`,
      );
    }
    if (shouldSkipWriteToSegment()) return;
    analytics.track(`frontend_cpa_${eventName}`, fullMetadata);
  };

  const trackClientIntakeChatHistoryViewed = (metadata: {
    justiceInvolvedPersonId: string;
    section: string;
  }) => {
    track("client_intake_chat_history_viewed", metadata);
  };

  const trackClientIntakeManuallyEnabled = (metadata: {
    justiceInvolvedPersonId: string;
  }) => {
    track("client_intake_manually_enabled", metadata);
  };

  const trackIntakeChatEvent = (
    eventName: string,
    metadata: {
      justiceInvolvedPersonId: string;
    },
  ) => {
    // The track() method defined above is not used here because, unlike other flows,
    // the intake assessment is a public route and has no Auth0 authentication.
    // And since internal users do not log into the assessment into production,
    // there is no need to check if the user is an internal user before emitting the
    // event if we're only emitting events from production.
    if (!isAnalyticsDisabled)
      analytics.track(`frontend_cpa_intake_chat_${eventName}`, metadata);
  };

  const trackIntakeChatClientLogin = ({
    // renaming this for backwards compatibility between the intake interface
    // and the existing event structure
    justiceInvolvedPersonPseudoId: justiceInvolvedPersonId,
  }: {
    justiceInvolvedPersonPseudoId: string;
  }) => {
    trackIntakeChatEvent("client_login", { justiceInvolvedPersonId });
  };

  const trackIntakeChatClientAddressSubmitted = ({
    // renaming this for backwards compatibility between the intake interface
    // and the existing event structure
    justiceInvolvedPersonPseudoId: justiceInvolvedPersonId,
  }: {
    justiceInvolvedPersonPseudoId: string;
  }) => {
    trackIntakeChatEvent("client_address_submitted", {
      justiceInvolvedPersonId,
    });
  };

  const trackClientHomeAddressSubmitted = (metadata: {
    justiceInvolvedPersonId: string;
  }) => {
    track("client_home_address_submitted", metadata);
  };

  const trackAssessmentRecordingStatusUpdated = (metadata: {
    justiceInvolvedPersonId: string;
    sessionId: string;
    status: string;
  }) => {
    track(`assessment_recording_status_updated`, metadata);
  };

  useEffect(() => {
    const userHash = auth.userAppMetadata?.["userHash"];
    if (auth.state.isAuthorized && userHash) {
      identify(userHash);
    }
  }, [auth.state.isAuthorized, auth.userAppMetadata]);

  return (
    <AnalyticsContext.Provider
      value={{
        identify,
        pageView,
        track,
        trackClientIntakeChatHistoryViewed,
        trackClientIntakeManuallyEnabled,
        trackAssessmentRecordingStatusUpdated,
        trackIntakeChatClientLogin,
        trackClientHomeAddressSubmitted,
        trackIntakeChatClientAddressSubmitted,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);

  if (!context) {
    // This error is very helpful for debugging!
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }

  return context;
};
