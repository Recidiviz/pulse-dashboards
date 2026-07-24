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

import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

import {
  getItem,
  removeItem,
  saveItem,
} from "~@meetings/app/shared/lib/storage";

import { parsePrPreviewLink } from "./parsePrPreviewLink";

const STORAGE_KEY = "meetings.prPreviewChannel";
// Tracks the last initial deep link we've already acted on, since
// Linking.getInitialURL() keeps returning it across reloads in-process.
const HANDLED_INITIAL_URL_STORAGE_KEY = "meetings.prPreviewHandledInitialUrl";

const isSupported = Platform.OS !== "web" && Updates.isEnabled;

// Active only in updates-enabled builds whose baked-in channel isn't
// "production" (staging, dev clients, local release builds). The prod app
// must never swap its bundle for unreviewed PR code via a crafted link.
const canLoadPreviews = isSupported && Updates.channel !== "production";

function alertNoPreview() {
  Alert.alert(
    "Preview unavailable",
    "No compatible preview found for this build.",
  );
}

export function usePrPreview() {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  // Read by handleUrl so its identity can stay stable across renders.
  const activeChannelRef = useRef<string | null>(null);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  useEffect(() => {
    if (!isSupported) return;

    getItem(STORAGE_KEY).then((stored) => {
      if (stored) setActiveChannel(stored);
    });
  }, []);

  const loadChannel = useCallback(async (channel: string) => {
    try {
      Updates.setUpdateRequestHeadersOverride({ "expo-channel-name": channel });

      // isAvailable is true if the server has a matching update for this channel
      // (even if already downloaded locally), false only when none exists.
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        Updates.setUpdateRequestHeadersOverride(null);
        alertNoPreview();
        return;
      }

      await Updates.fetchUpdateAsync();
      await saveItem(STORAGE_KEY, channel);
      await Updates.reloadAsync();
    } catch {
      Updates.setUpdateRequestHeadersOverride(null);
      await removeItem(STORAGE_KEY);
      await removeItem(HANDLED_INITIAL_URL_STORAGE_KEY);
      alertNoPreview();
    }
  }, []);

  useEffect(() => {
    if (!canLoadPreviews) return;

    // Scans auto-load without a confirmation; the header chip is the way out.
    const handleUrl = (url: string) => {
      const channel = parsePrPreviewLink(url);
      // Ignore links for the channel that's already active, e.g. the ghost
      // initial URL replay after reloadAsync onto that same channel.
      if (channel && channel !== activeChannelRef.current) {
        void loadChannel(channel);
      }
    };

    Linking.getInitialURL().then(async (url) => {
      if (!url || !parsePrPreviewLink(url)) return;

      // getInitialURL() keeps returning the same link across reloads within
      // this native process; only act on a given URL once.
      const handledUrl = await getItem(HANDLED_INITIAL_URL_STORAGE_KEY);
      if (handledUrl === url) return;

      await saveItem(HANDLED_INITIAL_URL_STORAGE_KEY, url);
      handleUrl(url);
    });

    // Live deep-link scans are never deduped against the handled-initial-URL
    // guard above.
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );

    return () => subscription.remove();
  }, [loadChannel]);

  const exitPreview = useCallback(async () => {
    setIsExiting(true);
    try {
      Updates.setUpdateRequestHeadersOverride(null);
      await Updates.fetchUpdateAsync();
      await removeItem(STORAGE_KEY);
      // getInitialURL keeps returning the launch link across reloadAsync in
      // this process; mark it consumed so exiting doesn't re-prompt for it.
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && parsePrPreviewLink(initialUrl)) {
        await saveItem(HANDLED_INITIAL_URL_STORAGE_KEY, initialUrl);
      } else {
        await removeItem(HANDLED_INITIAL_URL_STORAGE_KEY);
      }
      await Updates.reloadAsync();
    } catch {
      Alert.alert(
        "Exit failed",
        "Couldn't return to the staging build. Please try again.",
      );
      // Re-apply the preview override so runtime state matches activeChannel.
      if (activeChannel) {
        Updates.setUpdateRequestHeadersOverride({
          "expo-channel-name": activeChannel,
        });
      }
      setIsExiting(false);
    }
  }, [activeChannel]);

  const promptExitPreview = useCallback(() => {
    Alert.alert("Exit PR preview?", "Return to the latest staging build?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => void exitPreview(),
      },
    ]);
  }, [exitPreview]);

  return {
    activeChannel,
    exitPreview,
    promptExitPreview,
    isExiting,
  };
}
