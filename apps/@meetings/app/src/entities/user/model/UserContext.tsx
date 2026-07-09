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
} from "react";
import type { Credentials } from "react-native-auth0";
import { useAuth0 } from "react-native-auth0";

import { env } from "~@meetings/app/shared/config";
import { isLoginRequiredError } from "~@meetings/app/shared/lib/auth";
import { extractError } from "~@meetings/app/shared/lib/errors";
import type { FeatureVariantRecord } from "~@meetings/trpc-types";

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

  // On session expiry, clear local credentials so `user` becomes null and
  // AppNavigator routes to login. clearCredentials (not clearSession) avoids a
  // federated-logout page redirect on web.
  const getCredentialsWithReauth = useCallback<
    UserContextType["getCredentials"]
  >(
    async (...args) => {
      try {
        return await getCredentials(...args);
      } catch (error) {
        if (isLoginRequiredError(error)) {
          Sentry.logger.warn("auth.session_expired.redirect_to_login", {
            error: extractError(error),
          });
          // Honor the resolve-to-undefined contract even if clearing fails.
          try {
            await clearCredentials();
          } catch (clearError) {
            Sentry.logger.error("auth.clear_credentials.error", {
              error: extractError(clearError),
            });
            Sentry.captureException(clearError);
          }
          return undefined;
        }
        throw error;
      }
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
        Sentry.logger.error("auth.populate_metadata.error", {
          error: extractError(error),
        });
        Sentry.captureException(error);
      });
    }
  }, [isSkipAuthUser, user, isLoading, getCredentialsWithReauth]);

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
