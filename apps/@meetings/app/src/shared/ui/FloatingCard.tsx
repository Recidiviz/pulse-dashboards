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

import clsx from "clsx";
import { View, ViewProps } from "react-native";

type FloatingCardPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "top-right"
  | "top-left"
  | "top-center"
  | "manual";

const POSITION_CLASSES: Record<
  Exclude<FloatingCardPosition, "manual">,
  string
> = {
  "bottom-right": "bottom-5 left-5 right-5 md:left-auto",
  "bottom-left": "bottom-5 left-5 right-5 md:right-auto",
  "bottom-center": "bottom-5 left-5 right-5",
  "top-right": "top-5 left-5 right-5 md:left-auto",
  "top-left": "top-5 left-5 right-5 md:right-auto",
  "top-center": "top-5 left-5 right-5",
};

type Props = ViewProps & {
  children: React.ReactNode;
  position: FloatingCardPosition;
};

export function FloatingCard({
  children,
  className,
  position,
  ...props
}: Props) {
  return (
    <View
      className={clsx(
        "absolute overflow-hidden rounded-[20px] bg-primary p-5 shadow-[3px_5px_30px_5px_rgba(0,0,0,0.05)]",
        position !== "manual" && POSITION_CLASSES[position],
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}
