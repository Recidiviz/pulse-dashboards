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
import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

export type StatusTone = "bad" | "partial" | "good" | "info" | "neutral";

const TONE_CLASSES: Record<
  StatusTone,
  { container: string; text: string; dot: string }
> = {
  bad: {
    container: "bg-attention-light-secondary",
    text: "!text-attention",
    dot: "bg-attention",
  },
  partial: {
    container: "bg-warning-light",
    text: "!text-warning",
    dot: "bg-warning",
  },
  good: {
    container: "bg-brand-light",
    text: "!text-brand",
    dot: "bg-brand",
  },
  info: {
    container: "border border-subtle bg-primary",
    text: "!text-primary",
    dot: "bg-secondary",
  },
  neutral: {
    container: "bg-secondary",
    text: "!text-secondary",
    dot: "bg-tertiary",
  },
};

type StatusBadgeProps = {
  tone: StatusTone;
  /** A leading dot, used for grades so the tone doesn't rely on colour alone. */
  dot?: boolean;
  children: string;
  className?: string;
};

export const StatusBadge = ({
  tone,
  dot = false,
  children,
  className,
}: StatusBadgeProps) => {
  const classes = TONE_CLASSES[tone];
  return (
    <View
      className={clsx(
        "max-w-full flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-0.5",
        classes.container,
        className,
      )}
    >
      {dot && <View className={clsx("size-1.5 rounded-full", classes.dot)} />}
      {/* shrink lets a long label wrap inside a narrow table cell. */}
      <Typography
        variant="caption-s-medium"
        className={clsx("shrink", classes.text)}
      >
        {children}
      </Typography>
    </View>
  );
};
