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

"use client";

import Image from "next/image";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

interface InfoTooltipProps {
  text: string;
  size?: number;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function InfoTooltip({
  text,
  size = 15,
  position = "top",
  className = "",
}: InfoTooltipProps) {
  // Unique ID for each tooltip instance
  const id = useId();

  return (
    <>
      <Image
        data-tooltip-id={id}
        data-tooltip-content={text}
        src="/images/info_icon.svg"
        alt="info icon"
        width={size}
        height={size}
        className={`cursor-pointer ${className}`}
      />

      <Tooltip
        id={id}
        place={position}
        className="bg-gray-800 text-white text-[10px] italic rounded-md px-2 py-1 z-[9999]"
      />
    </>
  );
}
