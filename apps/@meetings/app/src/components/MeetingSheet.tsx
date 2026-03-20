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

import React from "react";
import { TouchableOpacity, View } from "react-native";

import { Typography } from "../shared/ui/Typography";

interface ButtonConfig {
  label: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "neutral";
}

interface MeetingSheetProps {
  title: string;
  description: string;
  primaryButton: ButtonConfig;
  secondaryButton?: ButtonConfig;
  tertiaryButton?: ButtonConfig;
}

const getButtonClasses = (variant: string) => {
  switch (variant) {
    case "danger":
      return "bg-[#B42D2D] text-white";
    case "primary":
      return "bg-[#006C67] text-white";
    case "neutral":
      return "bg-transparent text-primary";
    default:
      return "bg-transparent text-primary";
  }
};

const MeetingSheet: React.FC<MeetingSheetProps> = ({
  title,
  description,
  primaryButton,
  secondaryButton,
  tertiaryButton,
}) => {
  // Primary button classes
  let primaryBgClass = "bg-transparent";
  let primaryTextClass = "text-on-brand";

  if (primaryButton.variant === "danger") {
    primaryBgClass = "bg-attention";
  } else if (primaryButton.variant === "primary") {
    primaryBgClass = "bg-brand";
  }

  if (primaryButton.variant === "neutral") {
    primaryTextClass = "text-primary";
  }

  // Secondary button classes
  let secondaryBgClass = "bg-transparent";
  let secondaryTextClass = "text-primary";

  if (secondaryButton?.variant === "primary") {
    secondaryBgClass = "bg-secondary";
    secondaryTextClass = "text-on-brand";
  }

  const SecondaryButton = secondaryButton ? (
    <TouchableOpacity
      className={`mb-3 w-72 items-center self-center rounded-full py-4 ${secondaryBgClass}`}
      onPress={secondaryButton.onPress}
    >
      <Typography className={`font-semibold ${secondaryTextClass}`}>
        {secondaryButton.label}
      </Typography>
    </TouchableOpacity>
  ) : null;

  const TertiaryButton = tertiaryButton ? (
    <TouchableOpacity
      className={`items-center justify-center rounded-full py-4 ${getButtonClasses(
        tertiaryButton.variant || "primary",
      )}`}
      onPress={tertiaryButton.onPress}
    >
      <Typography className="font-semibold text-attention">
        {tertiaryButton.label}
      </Typography>
    </TouchableOpacity>
  ) : null;

  return (
    <View className="rounded-t-3xl bg-primary p-6 shadow-lg">
      <Typography className="mb-4 px-4 text-center text-lg font-bold text-primary">
        {title}
      </Typography>
      <Typography className="mb-6 w-80 self-center px-4 text-center text-sm text-secondary">
        {description}
      </Typography>
      <TouchableOpacity
        className={`mb-3 w-72 items-center self-center rounded-full py-4 ${primaryBgClass}`}
        onPress={primaryButton.onPress}
      >
        <Typography className={`font-semibold ${primaryTextClass} text-center`}>
          {primaryButton.label}
        </Typography>
      </TouchableOpacity>
      {SecondaryButton}
      {TertiaryButton}
    </View>
  );
};

export default MeetingSheet;
