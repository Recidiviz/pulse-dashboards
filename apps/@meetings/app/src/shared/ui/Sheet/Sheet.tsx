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

import { BottomSheet, RNHostView } from "@expo/ui";
import { useEffect } from "react";
import { View } from "react-native";

import { theme } from "../../config/theme";
import type { SheetProps } from "./types";

/**
 * A bottom sheet that sizes to its content, on web
 */
export function Sheet({
  visible,
  onClose,
  onDismissed,
  showDragIndicator = true,
  className,
  children,
}: SheetProps) {
  // vaul doesn't report the end of its exit animation, and the browser has no
  // trouble opening something else while it plays.
  useEffect(() => {
    if (!visible) onDismissed?.();
  }, [visible, onDismissed]);

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator={showDragIndicator}
      contentPadding={0}
      containerColor={theme["backgroundColor"]["primary"]}
    >
      <RNHostView matchContents={{ vertical: true }}>
        <View className={className}>{children}</View>
      </RNHostView>
    </BottomSheet>
  );
}
