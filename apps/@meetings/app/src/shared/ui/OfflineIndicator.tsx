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

import * as TooltipPrimitive from "@rn-primitives/tooltip";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import CloudOffline from "../assets/icons/cloud-off.svg";
import useIsOnline from "../lib/useIsOnline";
import { Typography } from "./Typography";

type Props = {
  rootClassName?: string;
  triggerClassName?: string;
  iconClassName?: string;
  enableTooltip?: boolean;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  alignOffset?: number;
  isInsideModal?: boolean;
};

export function OfflineIndicator({
  rootClassName,
  triggerClassName,
  iconClassName,
  enableTooltip = false,
  side = "top",
  align = "center",
  alignOffset = 0,
  isInsideModal,
}: Props) {
  const { isOnline } = useIsOnline();
  const [modal, setModal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // this is basically a hack because on web there is a stacking context
    // and since we want to show tooltip inside modal and modal has
    // higher stacking context tooltip appears below it
    if (Platform.OS === "web" && isInsideModal) {
      const modal = document.getElementById("rnmodal");
      setModal(modal);
    }
  }, [isInsideModal]);

  if (isOnline) {
    return null;
  }

  return (
    <TooltipPrimitive.Root
      className={clsx(
        rootClassName,
        enableTooltip ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <TooltipPrimitive.Trigger
        className={clsx(
          "relative flex items-center justify-center",
          triggerClassName,
        )}
      >
        <CloudOffline className={iconClassName} />
      </TooltipPrimitive.Trigger>
      {enableTooltip && (
        <TooltipPrimitive.Portal container={modal}>
          <TooltipPrimitive.Content
            className="z-100 relative flex w-80 flex-col gap-1 rounded-xl bg-strong p-4 md:w-96"
            side={side}
            align={align}
            sideOffset={16}
            alignOffset={alignOffset}
          >
            <Typography className="text-base font-normal text-on-brand">
              Offline mode
            </Typography>
            <Typography className="text-sm font-normal text-on-brand">
              Everything is fine. Your meeting is being recorded locally and
              will upload once you're back online. Keep going!
            </Typography>
            <View
              className={clsx(
                "absolute -z-10 size-8 rotate-45 bg-strong",
                side === "top" && "bottom-0",
                side === "bottom" && "top-0",
                align === "center" && "left-1/2",
                align === "center" &&
                  Platform.OS === "web" &&
                  "-translate-x-1/2",
              )}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </TooltipPrimitive.Root>
  );
}
