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
import { useRef, useState } from "react";

import { Typography } from "./Typography";

type Props = {
  children: React.ReactNode;
  rootClassName?: string;
  triggerClassName?: string;
  triggerTextClassName?: string;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  alignOffset?: number;
};

export function TooltipText({
  children,
  rootClassName,
  triggerClassName,
  triggerTextClassName,
  side = "bottom",
  align = "center",
  alignOffset = 0,
}: Props) {
  const containerWidthRef = useRef(0);
  const fullTextWidthRef = useRef(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = () => {
    if (fullTextWidthRef.current > 0 && containerWidthRef.current > 0) {
      setIsOverflowing(fullTextWidthRef.current > containerWidthRef.current);
    }
  };

  return (
    <TooltipPrimitive.Root className={clsx(rootClassName)}>
      <TooltipPrimitive.Trigger
        className={clsx("relative flex w-full", triggerClassName)}
        onLayout={(e) => {
          containerWidthRef.current = e.nativeEvent.layout.width;
          checkOverflow();
        }}
      >
        <Typography
          className={`pointer-events-none absolute text-base opacity-0 ${triggerTextClassName} max-w-fit`}
          numberOfLines={1}
          onLayout={(e) => {
            fullTextWidthRef.current = e.nativeEvent.layout.width;
            checkOverflow();
          }}
        >
          {children}
        </Typography>
        <Typography
          className={`text-base text-primary ${triggerTextClassName}`}
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {children}
        </Typography>
      </TooltipPrimitive.Trigger>
      {isOverflowing && (
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-100 relative flex w-fit flex-col gap-1 rounded-xl bg-strong p-2"
            side={side}
            align={align}
            sideOffset={8}
            alignOffset={alignOffset}
          >
            <Typography className="text-sm font-normal text-on-brand">
              {children}
            </Typography>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </TooltipPrimitive.Root>
  );
}
