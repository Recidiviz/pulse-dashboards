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

import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ButtonConfig {
  label: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "neutral";
  countdown?: number;
}

interface MeetingSheetProps {
  title: string;
  description: string;
  primaryButton: ButtonConfig;
  secondaryButton?: ButtonConfig;
  tertiaryButton?: ButtonConfig;
}

const getButtonClasses = (variant: string, disabled: boolean) => {
  if (disabled) return "bg-gray-300 text-white";
  switch (variant) {
    case "danger":
      return "bg-[#B42D2D] text-white";
    case "primary":
      return "bg-[#006C67] text-white";
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
  const [countdown, setCountdown] = useState(primaryButton.countdown ?? 0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [countdown]);

  const isPrimaryDisabled = countdown > 0;

  const primaryBgClass = isPrimaryDisabled ? "bg-gray-300" : "bg-[#B42D2D]";
  const primaryTextClass = isPrimaryDisabled ? "text-gray-500" : "text-white";

  const SecondaryButton = secondaryButton ? (
    <TouchableOpacity
      className={`mb-3 w-72 items-center self-center rounded-full py-4 ${
        secondaryButton.variant === "primary"
          ? "bg-[#4D5255]"
          : "bg-transparent"
      }`}
      onPress={secondaryButton.onPress}
    >
      <Text
        className={`font-semibold ${
          secondaryButton.variant === "primary" ? "text-white" : "text-primary"
        }`}
      >
        {secondaryButton.label}
      </Text>
    </TouchableOpacity>
  ) : null;

  const TertiaryButton = tertiaryButton ? (
    <TouchableOpacity
      className={`items-center justify-center rounded-full py-4 ${getButtonClasses(
        tertiaryButton.variant || "primary",
        false,
      )}`}
      onPress={tertiaryButton.onPress}
    >
      <Text className="font-semibold text-[#B42D2D]">
        {tertiaryButton.label}
      </Text>
    </TouchableOpacity>
  ) : null;

  return (
    <View className="rounded-t-3xl bg-white p-6 shadow-lg">
      <Text className="text-primary mb-4 px-4 text-center text-lg font-bold">
        {title}
      </Text>
      <Text className="mb-6 w-80 self-center px-4 text-center text-sm text-gray-500">
        {description}
      </Text>
      <TouchableOpacity
        className={`mb-3 items-center self-center rounded-full py-4 ${primaryBgClass} w-72`}
        disabled={isPrimaryDisabled}
        onPress={primaryButton.onPress}
      >
        <Text className={`font-semibold ${primaryTextClass} text-center`}>
          {isPrimaryDisabled
            ? `${primaryButton.label} (0:0${countdown})`
            : primaryButton.label}
        </Text>
      </TouchableOpacity>

      {SecondaryButton}
      {TertiaryButton}
    </View>
  );
};

export default MeetingSheet;
