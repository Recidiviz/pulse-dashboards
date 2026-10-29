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

import {
  Host,
  ModalBottomSheet,
  type ModalBottomSheetRef,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { theme } from "../../config/theme";
import type { SheetProps } from "./types";
import { useSheetMaxHeight } from "./useSheetMaxHeight";

const DRAG_HANDLE_HEIGHT = 48;

/**
 * A bottom sheet that sizes to its content.
 *
 * Android uses Compose's ModalBottomSheet directly rather than Expo UI's
 * universal BottomSheet, which can't skip the half-expanded state without
 * also stretching the sheet to full screen. A sheet taller than half the
 * screen would otherwise open half-expanded, with the end of its content
 * below the screen.
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
  const sheetRef = useRef<ModalBottomSheetRef>(null);
  const [isMounted, setIsMounted] = useState(visible);
  const maxHeight = useSheetMaxHeight(
    showDragIndicator ? DRAG_HANDLE_HEIGHT : 0,
  );

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      return;
    }
    let cancelled = false;
    sheetRef.current?.hide().then(() => {
      if (cancelled) return;
      setIsMounted(false);
      onDismissed?.();
    });
    return () => {
      cancelled = true;
    };
  }, [visible, onDismissed]);

  if (!isMounted) return null;

  return (
    <Host style={{ position: "absolute" }} pointerEvents="none">
      <ModalBottomSheet
        ref={sheetRef}
        onDismissRequest={onClose}
        skipPartiallyExpanded
        sheetGesturesEnabled={dismissible}
        properties={{
          shouldDismissOnBackPress: dismissible,
          shouldDismissOnClickOutside: dismissible,
        }}
        showDragHandle={showDragIndicator}
        containerColor={theme["backgroundColor"]["primary"]}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <View className={className} style={{ maxHeight }}>
            {children}
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
