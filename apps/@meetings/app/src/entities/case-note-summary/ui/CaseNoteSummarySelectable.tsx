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
import { GestureResponderEvent, View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { toWords } from "../lib/toWords";
import { CaseNoteSummarySegment } from "../model/types";

type Props = {
  segments: CaseNoteSummarySegment[];
  selectedIndex?: number;
  onSelectedIndexChange: (index?: number) => void;
};

/**
 * Reports the pressed phrase to the parent, which owns the selection and
 * renders the citation wherever it likes.
 */
export function CaseNoteSummarySelectable({
  segments,
  selectedIndex,
  onSelectedIndexChange,
}: Props) {
  const onSegmentPress = (event: GestureResponderEvent, index: number) => {
    // Keeps the press off the background of a surrounding BackgroundPressable:
    // on web the click bubbles to it and would clear the selection we just made
    event.stopPropagation();

    // Pressing the selected phrase again clears it
    onSelectedIndexChange(index === selectedIndex ? undefined : index);
  };

  return (
    <View className="flex-row flex-wrap items-baseline">
      {toWords(segments).map(({ text, segmentIndex, isCited }, index) => (
        <Typography
          key={`${index}-${text}`}
          onPress={
            isCited ? (event) => onSegmentPress(event, segmentIndex) : undefined
          }
          suppressHighlighting
          className={clsx(
            "text-base",
            isCited
              ? "border-b border-dotted font-medium"
              : "font-normal text-secondary",
            isCited &&
              (segmentIndex === selectedIndex
                ? "border-brand bg-brand-light text-brand"
                : "border-primary text-secondary"),
          )}
        >
          {text}
        </Typography>
      ))}
    </View>
  );
}
