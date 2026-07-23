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
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import type { Credentials } from "react-native-auth0";
import { useAuth0 } from "react-native-auth0";

import { env } from "~@meetings/app/shared/config";
import {
  isKeystoreCredentialError,
  isLoginRequiredError,
} from "~@meetings/app/shared/lib/auth";
import { extractErrorDetails } from "~@meetings/app/shared/lib/errors";
import type { FeatureVariantRecord } from "~@meetings/trpc-types";

// react-native-auth0's getCredentials(scope, minTtl, ...) minTtl is in seconds.
// With a ~900s (15min) access-token TTL, a 60s buffer gives the SDK lead time
// to refresh before a request fires, without materially increasing refresh
// frequency.
export const ACCESS_TOKEN_MIN_TTL_SECONDS = 60;

// Covers a single continuous foreground session that outlasts the access
// token's TTL without ever backgrounding (the foreground-transition refresh
// below only fires on a background -> active transition, so it can't catch
// this case). 5 minutes gives 3 checks within the ~15min TTL window, well
// inside the minTtl buffer's margin.
const PROACTIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface UserContextType {
  isLoading: boolean;
  /**
   * The user's state code (e.g., "US_ND", "US_ME", or "recidiviz").
   * For state users, this is their single assigned state and determines their data access.
   * For Recidiviz staff, this is always "recidiviz" and they can select which state's data to view.
   */
  stateCode: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  isSkipAuthUser: boolean;
  recidivizAllowedStates: string[];
  hasSupervisionAccess: boolean;
  hasFacilitiesAccess: boolean;
  hasSupervisionAssistantAccess: boolean;
  hasFacilitiesAssistantAccess: boolean;
  hasCasePlanningAssistantAccess: boolean;
  isRecidivizUser: boolean;
  onLogout: ReturnType<typeof useAuth0>["clearSession"];
  /**
   * Wrapped Auth0 `getCredentials`. On session expiry it clears the local
   * session, redirects to login, and resolves to `undefined` instead of
   * rejecting, so callers must handle a missing token.
   */
  getCredentials: (
    scope?: string,
    minTtl?: number,
    parameters?: Record<string, unknown>,
    forceRefresh?: boolean,
  ) => Promise<Credentials | undefined>;
  featureVariants?: FeatureVariantRecord;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserContextProvider: React.FC<{
  isSkipAuthUser: boolean;
  children: React.ReactNode;
}> = ({ isSkipAuthUser, children }) => {
  const { user, isLoading, clearSession, getCredentials, clearCredentials } =
    useAuth0();

  // Concurrent getCredentials() calls (e.g. several tRPC requests firing close
  // together) can each try to exchange the same refresh token at once. Auth0's
  // Refresh Token Rotation treats that as suspicious reuse and invalidates the
  // whole token family, permanently killing the refresh token and forcing a
  // full re-auth. Funneling every call through one shared in-flight promise
  // ensures at most one real SDK exchange is ever in flight at a time.
  // See https://github.com/auth0/react-native-auth0/issues/1374.
  const inFlightRef = useRef<Promise<Credentials | undefined> | null>(null);

  // On session expiry, clear local credentials so `user` becomes null and
  // AppNavigator routes to login. clearCredentials (not clearSession) avoids a
  // federated-logout page redirect on web.
  const getCredentialsWithReauth = useCallback<
    UserContextType["getCredentials"]
  >(
    (...args) => {
      if (inFlightRef.current) return inFlightRef.current;

      const request = (async () => {
        try {
          return await getCredentials(...args);
        } catch (error) {
          if (isLoginRequiredError(error)) {
            // extractErrorDetails surfaces the normalized `errorType`
            // (NO_CREDENTIALS vs NO_REFRESH_TOKEN vs RENEW_FAILED), which
            // distinguishes a truly-empty store from a failed renewal — the
            // free-text message alone is scrubbed to `[Filtered]` on Android.
            Sentry.logger.warn(
              "auth.session_expired.redirect_to_login",
              extractErrorDetails(error),
            );
            // Honor the resolve-to-undefined contract even if clearing fails.
            try {
              await clearCredentials();
            } catch (clearError) {
              Sentry.logger.error(
                "auth.clear_credentials.error",
                extractErrorDetails(clearError),
              );
              Sentry.captureException(clearError);
            }
            return undefined;
          }
          // A Keystore/secure-store crypto failure. This is on-device (never
          // reaches Auth0's servers) and, on Android, the SDK has already
          // wiped the stored credentials before throwing — so a later
          // getCredentials() will throw NO_CREDENTIALS and force a logout.
          // Logging it distinctly (with the native `errorCause`) is what makes
          // that otherwise-invisible root cause diagnosable. Still rethrow so
          // callers keep their existing non-session-expiry handling.
          if (isKeystoreCredentialError(error)) {
            Sentry.logger.error(
              "auth.keystore_failure",
              extractErrorDetails(error),
            );
          }
          throw error;
        }
      })();

      inFlightRef.current = request;
      // Clears the in-flight ref once settled. `request` itself is returned
      // to (and handled by) the caller below, so this chained catch only
      // exists to prevent an unhandled-rejection warning on this internal
      // `.finally()` continuation, not to swallow the error for callers.
      request
        .finally(() => {
          inFlightRef.current = null;
        })
        .catch(() => undefined);
      return request;
    },
    [getCredentials, clearCredentials],
  );

  // Fetch credentials when user first loads to populate app_metadata. For some reason this only
  // gets populated on the user if we request credentials.
  useEffect(() => {
    if (!isSkipAuthUser && user && !isLoading) {
      // Fire-and-forget; .catch prevents an unhandled rejection.
      void getCredentialsWithReauth(undefined, undefined, {
        audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      }).catch((error) => {
        Sentry.logger.error(
          "auth.populate_metadata.error",
          extractErrorDetails(error),
        );
        Sentry.captureException(error);
      });
    }
  }, [isSkipAuthUser, user, isLoading, getCredentialsWithReauth]);

  // Proactively refresh credentials whenever the app returns to the
  // foreground. Without this, a token that quietly expires while the app is
  // backgrounded (e.g. during a long recording) isn't noticed until whatever
  // the user's next action happens to be, which can hit a dead token even
  // with the minTtl buffer above — that buffer only helps if a
  // getCredentials() call actually happens before expiry.
  // Defaults to "active" if the native module hasn't reported a real state
  // yet (e.g. in tests, where AppState is mocked and currentState isn't
  // necessarily a string), so we never spuriously treat the very first
  // "change" event as a background -> active transition.
  const appStateRef = useRef<AppStateStatus>(
    typeof AppState.currentState === "string"
      ? AppState.currentState
      : "active",
  );
  useEffect(() => {
    if (isSkipAuthUser || !user) return;

    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          next === "active"
        ) {
          void getCredentialsWithReauth(
            undefined,
            ACCESS_TOKEN_MIN_TTL_SECONDS,
            {
              audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
            },
          ).catch((error) => {
            Sentry.logger.error(
              "auth.foreground_refresh.error",
              extractErrorDetails(error),
            );
            Sentry.captureException(error);
          });
        }
        appStateRef.current = next;
      },
    );

    return () => subscription?.remove();
  }, [isSkipAuthUser, user, getCredentialsWithReauth]);

  // Also refresh on a plain interval, independent of any AppState transition,
  // to cover a single continuous foreground session that outlasts the token
  // TTL without ever backgrounding.
  useEffect(() => {
    if (isSkipAuthUser || !user) return;

    const intervalId = setInterval(() => {
      void getCredentialsWithReauth(undefined, ACCESS_TOKEN_MIN_TTL_SECONDS, {
        audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      }).catch((error) => {
        Sentry.logger.error(
          "auth.periodic_refresh.error",
          extractErrorDetails(error),
        );
        Sentry.captureException(error);
      });
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isSkipAuthUser, user, getCredentialsWithReauth]);

  useEffect(() => {
    if (isSkipAuthUser) {
      Sentry.setUser({ email: "skip-auth-user" });
      return;
    }
    if (user?.email) {
      Sentry.setUser({ email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user?.email, isSkipAuthUser]);

  if (isSkipAuthUser) {
    return (
      <UserContext.Provider
        value={{
          isLoading: false,
          stateCode: "US_NE",
          isSkipAuthUser: true,
          // Agency configs are loaded asynchronously via AgencyConfigContext (which lives inside
          // the tRPC provider, below UserContextProvider in the tree). Skip-auth state selection
          // is still enabled via isSkipAuthUser, so this can safely be empty here.
          recidivizAllowedStates: [],
          hasSupervisionAccess: true,
          hasFacilitiesAccess: true,
          hasSupervisionAssistantAccess: true,
          hasFacilitiesAssistantAccess: true,
          hasCasePlanningAssistantAccess: true,
          onLogout: () => Promise.resolve(),
          getCredentials: getCredentialsWithReauth,
          isRecidivizUser: true,
          featureVariants: undefined,
          email: "staff-email-1@example.com",
          name: "Unauthenticated Staff",
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }

  const userAppMetadata =
    user?.[`https://dashboard.recidiviz.org/app_metadata`];

  const isRecidiviz = userAppMetadata?.stateCode === "recidiviz";
  let allowedStateCodes;
  if (isRecidiviz) {
    allowedStateCodes = userAppMetadata?.allowedStates ?? [];
  } else if (userAppMetadata?.stateCode) {
    allowedStateCodes = [userAppMetadata.stateCode];
  } else {
    allowedStateCodes = [];
  }

  const featureVariants =
    userAppMetadata?.featureVariants ?? ({} as FeatureVariantRecord);

  const routes = userAppMetadata?.routes as Record<string, boolean> | undefined;
  return (
    <UserContext.Provider
      value={{
        // If user exists but app_metadata hasn't loaded yet, keep showing loading state
        isLoading: isLoading || (!!user && !userAppMetadata),
        stateCode: userAppMetadata?.stateCode,
        name: user?.name,
        email: user?.email,
        isSkipAuthUser: false,
        recidivizAllowedStates: allowedStateCodes,
        hasSupervisionAccess: isRecidiviz || !!routes?.["meetingsSupervision"],
        hasFacilitiesAccess: isRecidiviz || !!routes?.["meetingsFacilities"],
        hasSupervisionAssistantAccess:
          isRecidiviz ||
          !!routes?.["workflowsSupervision"] ||
          !!routes?.["insights"],
        hasFacilitiesAssistantAccess:
          isRecidiviz || !!routes?.["workflowsFacilities"],
        hasCasePlanningAssistantAccess: isRecidiviz || !!routes?.["cpa"],
        onLogout: async () => {
          await clearSession();
        },
        getCredentials: getCredentialsWithReauth,
        isRecidivizUser: isRecidiviz,
        featureVariants,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
};
