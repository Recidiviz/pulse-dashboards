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

import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  tooltipText: string;
  children: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
  tooltipClassName?: string;
  tooltipTextClassName?: string;
};

export const TooltipText = ({
  tooltipText,
  children,
  containerClassName = "",
  textClassName = "",
  tooltipClassName = "",
  tooltipTextClassName = "",
}: Props) => {
  const [visible, setVisible] = useState(false);
  const containerWidthRef = useRef(0);
  const fullTextWidthRef = useRef(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = () => {
    if (fullTextWidthRef.current > 0 && containerWidthRef.current > 0) {
      setIsOverflowing(fullTextWidthRef.current > containerWidthRef.current);
    }
  };

  return (
    <Pressable
      className={`relative flex size-full flex-1 flex-row items-center ${containerClassName}`}
      onHoverIn={() => setVisible(true)}
      onHoverOut={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
        checkOverflow();
      }}
    >
      {/* Hidden text to measure full width for tooltip */}
      <Text
        className={`pointer-events-none absolute font-inter text-base opacity-0 ${textClassName} max-w-fit`}
        numberOfLines={1}
        onLayout={(e) => {
          fullTextWidthRef.current = e.nativeEvent.layout.width;
          checkOverflow();
        }}
      >
        {children}
      </Text>

      <Text
        className={`font-inter text-base text-gray/85 ${textClassName}`}
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {children}
      </Text>

      {isOverflowing && visible && (
        <View className="absolute left-0 top-11 w-[50vw]">
          <View
            className={`w-fit rounded-md bg-primary px-2 py-1 shadow-md ${tooltipClassName}`}
          >
            <Text className={`text-xs text-white ${tooltipTextClassName}`}>
              {tooltipText}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};
