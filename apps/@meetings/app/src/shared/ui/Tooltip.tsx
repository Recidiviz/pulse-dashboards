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

import { Arrow as ArrowWeb } from "@radix-ui/react-tooltip";
import * as TooltipPrimitive from "@rn-primitives/tooltip";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

/** Matches `size-4` on the arrow view. */
const ARROW_SIZE = 16;
/** Keeps the arrow clear of the bubble's rounded corners (`rounded-xl`). */
const ARROW_INSET = 12;

type Props = {
  /** The element that opens the tooltip: hovered on web, pressed on native. */
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  rootClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /**
   * Web only. Modals create their own stacking context, so a tooltip portalled
   * to the document root renders underneath one. Portal into the modal instead.
   */
  isInsideModal?: boolean;
};

/**
 * Tooltip with an arrow that points at its trigger.
 */
export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 8,
  rootClassName,
  triggerClassName,
  contentClassName,
  isInsideModal,
}: Props) {
  const isWeb = Platform.OS === "web";
  const triggerRef = useRef<TooltipPrimitive.TriggerRef>(null);
  const [triggerCenterX, setTriggerCenterX] = useState<number | null>(null);
  const [contentBox, setContentBox] = useState<{
    x: number;
    width: number;
  } | null>(null);
  const [modal, setModal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isWeb && isInsideModal) {
      setModal(document.getElementById("rnmodal"));
    }
  }, [isWeb, isInsideModal]);

  const handleOpenChange = (open: boolean) => {
    if (isWeb) return;

    if (!open) {
      // Both boxes are stale once the tooltip closes: the trigger may have
      // scrolled and the next open remounts the content.
      setTriggerCenterX(null);
      setContentBox(null);
      return;
    }

    triggerRef.current?.measure((_x, _y, width, _height, pageX) => {
      setTriggerCenterX(pageX + width / 2);
    });
  };

  const arrowLeft =
    triggerCenterX !== null && contentBox
      ? Math.min(
          Math.max(triggerCenterX - contentBox.x - ARROW_SIZE / 2, ARROW_INSET),
          contentBox.width - ARROW_INSET - ARROW_SIZE,
        )
      : null;

  const bubble = (
    <TooltipPrimitive.Content
      className={clsx(
        "relative z-50 max-w-xs rounded-xl bg-strong p-4",
        contentClassName,
      )}
      side={side}
      align={align}
      sideOffset={sideOffset}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        setContentBox({ x, width });
      }}
    >
      {content}
      {isWeb ? (
        <ArrowWeb className="fill-strong" />
      ) : (
        <View
          className={clsx(
            "absolute -z-10 size-4 rotate-45 bg-strong",
            side === "top" ? "bottom-0" : "top-0",
          )}
          style={arrowLeft === null ? undefined : { left: arrowLeft }}
        />
      )}
    </TooltipPrimitive.Content>
  );

  return (
    <TooltipPrimitive.Root
      delayDuration={0}
      onOpenChange={handleOpenChange}
      className={clsx("inline-flex items-baseline", rootClassName)}
    >
      <TooltipPrimitive.Trigger ref={triggerRef} className={triggerClassName}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={modal}>
        {/* we close tooltip by hoverOut for web and pressOut for mobile
            so we need mobile overlay */}
        {isWeb ? (
          bubble
        ) : (
          <>
            <TooltipPrimitive.Overlay style={StyleSheet.absoluteFill} />
            {bubble}
          </>
        )}
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
