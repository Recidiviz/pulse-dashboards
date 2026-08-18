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

import Intercom, { Visibility } from "@intercom/intercom-react-native";
import * as Sentry from "@sentry/react-native";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useUserContext } from "~@meetings/app/entities/user";
import { env } from "~@meetings/app/shared/config";

let initialized = false;

export function useIntercom() {
  const { name, email, segmentId, intercomId } = useUserContext();

  useEffect(() => {
    if (initialized) return;
    const appId = env.EXPO_PUBLIC_INTERCOM_APP_ID;
    const apiKey = Platform.select({
      ios: env.EXPO_PUBLIC_INTERCOM_IOS_API_KEY,
      android: env.EXPO_PUBLIC_INTERCOM_ANDROID_API_KEY,
    });
    if (!appId || !apiKey) return;
    initialized = true;
    Intercom.initialize(apiKey, appId).catch((error) => {
      Sentry.captureException(error);
    });
    // We render our own launcher (FeedbackLauncher) instead of Intercom's
    // default one, which took up too much space on mobile. The default
    // launcher is hidden by default on native platforms anyway, but set this
    // explicitly since we rely on it staying hidden.
    Intercom.setLauncherVisibility(Visibility.GONE);
  }, []);

  useEffect(() => {
    if (!env.EXPO_PUBLIC_INTERCOM_APP_ID || !intercomId) return;
    Intercom.setUserHash(intercomId);
    Intercom.loginUserWithUserAttributes({
      email,
      name,
      userId: segmentId,
    }).catch((error) => {
      Sentry.captureException(error);
    });
  }, [name, email, segmentId, intercomId]);

  return {
    openMessenger: () => {
      Intercom.present().catch((error) => {
        Sentry.captureException(error);
      });
    },
  };
}
