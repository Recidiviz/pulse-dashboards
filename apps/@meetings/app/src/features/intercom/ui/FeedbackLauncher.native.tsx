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

import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeContainer } from "~@meetings/app/shared/ui/FadeContainer";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useFeedbackLauncherVisibilityStore } from "../model/feedbackLauncherVisibility";

const LABEL = "FEEDBACK?";
// Width of the label's text box before it's rotated, i.e. how long the tab
// ends up looking. Kept generous relative to the label so it doesn't clip.
const LABEL_LENGTH = 90;

type Props = {
  onPress: () => void;
};

/**
 * A thin tab docked to the right edge of the screen that opens the Intercom
 * messenger. Stands in for Intercom's default launcher on native, which took
 * up too much space on mobile and sat in an awkward spot over other UI. Web
 * keeps Intercom's default launcher instead (see FeedbackLauncher.web.tsx).
 */
export function FeedbackLauncher({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const isScrolling = useFeedbackLauncherVisibilityStore(
    (state) => state.isScrolling,
  );
  const isSuppressed = useFeedbackLauncherVisibilityStore(
    (state) => state.isSuppressed,
  );

  return (
    <View
      className="absolute right-0 z-50"
      style={{ bottom: insets.bottom, width: 32, height: LABEL_LENGTH + 24 }}
    >
      <FadeContainer
        isVisible={!isScrolling && !isSuppressed}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Send us feedback"
          className="size-full items-center justify-center overflow-hidden rounded-tl-lg border border-subtle bg-secondary"
        >
          <Typography
            variant="caption-s-medium"
            numberOfLines={1}
            className="text-center uppercase tracking-widest text-secondary"
            style={{ width: LABEL_LENGTH, transform: [{ rotate: "-90deg" }] }}
          >
            {LABEL}
          </Typography>
        </TouchableOpacity>
      </FadeContainer>
    </View>
  );
}
