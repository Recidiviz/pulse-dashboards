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

import { BottomSheet, Group, Host, RNHostView } from "@expo/ui/swift-ui";
import {
  frame,
  interactiveDismissDisabled,
  presentationBackground,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { theme } from "../../config/theme";
import type { SheetProps } from "./types";
import { useSheetMaxHeight } from "./useSheetMaxHeight";

const IOS_SHEET_CHROME_HEIGHT = 24;

/**
 * A bottom sheet that sizes to its content.
 *
 * Uses SwiftUI's sheet directly rather than Expo UI's universal BottomSheet,
 * which doesn't report when the sheet has finished dismissing (onDismissed).
 */
export function Sheet({
  visible,
  onClose,
  onDismissed,
  showDragIndicator = true,
  dismissible = true,
  className,
  children,
}: SheetProps) {
  const maxHeight = useSheetMaxHeight(IOS_SHEET_CHROME_HEIGHT);

  return (
    <Host style={{ position: "absolute" }} pointerEvents="none">
      <BottomSheet
        isPresented={visible}
        // Fires only for changes made by the user, not by `visible`.
        onIsPresentedChange={(isPresented) => {
          if (!isPresented) onClose();
        }}
        onDismiss={onDismissed}
        fitToContents
      >
        <Group
          modifiers={[
            frame({ maxWidth: Infinity, alignment: "topLeading" }),
            presentationDragIndicator(showDragIndicator ? "visible" : "hidden"),
            presentationBackground(theme["backgroundColor"]["primary"]),
            interactiveDismissDisabled(!dismissible),
          ]}
        >
          <RNHostView matchContents={{ vertical: true }}>
            <View className={className} style={{ maxHeight }}>
              {children}
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}
