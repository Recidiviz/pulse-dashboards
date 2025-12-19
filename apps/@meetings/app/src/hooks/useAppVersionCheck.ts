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

import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

import { publicTrpc } from "../trpc/client";

interface VersionCheckOptions {
  title?: string;
  message?: string;
  forceUpgrade?: boolean;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

const APP_UPDATE_OPTIONS: VersionCheckOptions = {
  title: "Update Available",
  message:
    "A new version of Recidiviz is available. Please update for the best experience.",
  forceUpgrade: false,
  appStoreUrl: "https://apps.apple.com/app/recidiviz",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=org.recidiviz.app",
};

export function useAppVersionCheck() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

  const { data, isLoading, error } =
    publicTrpc.v1.metadata.checkAppVersion.useQuery(
      { appVersion: currentVersion },
      {
        // Only check once per app session
        staleTime: Infinity,
        // Don't retry on failure to avoid spamming the user
        retry: false,
      },
    );

  const updateRequired = data?.requiresUpgrade ?? false;

  useEffect(() => {
    if (updateRequired && !hasChecked && !isLoading) {
      setIsModalVisible(true);
      setHasChecked(true);
    }
  }, [updateRequired, hasChecked, isLoading]);

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    if (!APP_UPDATE_OPTIONS.forceUpgrade) {
      setIsModalVisible(false);
    }
  }, []);

  const openStore = useCallback(async () => {
    const url =
      Platform.OS === "ios"
        ? APP_UPDATE_OPTIONS.appStoreUrl
        : APP_UPDATE_OPTIONS.playStoreUrl;

    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    }
  }, []);

  return {
    updateRequired,
    isModalVisible,
    showModal,
    hideModal,
    openStore,
    isLoading,
    error: error as Error | null,
    currentVersion,
    options: APP_UPDATE_OPTIONS,
  };
}
