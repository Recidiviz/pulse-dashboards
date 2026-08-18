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

import { create } from "zustand";

// How long to wait after the last scroll event before letting the launcher
// reappear, so it doesn't flicker back on during brief pauses mid-scroll.
const SCROLL_HIDE_TIMEOUT_MS = 400;

type FeedbackLauncherVisibilityStore = {
  isScrolling: boolean;
  // Set by screens (e.g. onboarding) where the launcher shouldn't show at all.
  isSuppressed: boolean;
  setIsScrolling: (isScrolling: boolean) => void;
  setIsSuppressed: (isSuppressed: boolean) => void;
};

export const useFeedbackLauncherVisibilityStore =
  create<FeedbackLauncherVisibilityStore>()((set) => ({
    isScrolling: false,
    isSuppressed: false,
    setIsScrolling: (isScrolling) => set({ isScrolling }),
    setIsSuppressed: (isSuppressed) => set({ isSuppressed }),
  }));

let scrollHideTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Call from a main content screen's scroll handler to hide the feedback
 * launcher while the user is actively scrolling it.
 */
export function notifyFeedbackLauncherOfScroll() {
  const { isScrolling, setIsScrolling } =
    useFeedbackLauncherVisibilityStore.getState();
  if (!isScrolling) setIsScrolling(true);
  clearTimeout(scrollHideTimeout);
  scrollHideTimeout = setTimeout(() => {
    useFeedbackLauncherVisibilityStore.getState().setIsScrolling(false);
  }, SCROLL_HIDE_TIMEOUT_MS);
}

// Spread onto a main content ScrollView's props to wire it up to the above.
export const feedbackLauncherScrollProps = {
  onScroll: notifyFeedbackLauncherOfScroll,
  scrollEventThrottle: 16,
} as const;
