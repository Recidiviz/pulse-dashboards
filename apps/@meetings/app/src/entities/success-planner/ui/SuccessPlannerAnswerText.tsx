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

import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

const COLLAPSED_LINE_COUNT = 3;

const TRUNCATE_AT_CHARS = 220;

export function SuccessPlannerAnswerText({ value }: { value: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isTruncatable = value.length > TRUNCATE_AT_CHARS;

  return (
    <View className="gap-1">
      <Typography
        variant="body-s-regular"
        className="text-primary"
        numberOfLines={
          isTruncatable && !isExpanded ? COLLAPSED_LINE_COUNT : undefined
        }
      >
        {value}
      </Typography>
      {isTruncatable && (
        <TouchableOpacity
          onPress={() => setIsExpanded((expanded) => !expanded)}
          className="w-fit cursor-pointer flex-row items-center gap-1"
        >
          <Typography variant="caption-s-medium" className="!text-brand">
            {isExpanded ? "Collapse" : "Show more"}
          </Typography>
          {isExpanded ? (
            <ChevronUpIcon className="size-3 stroke-brand stroke-2" />
          ) : (
            <ChevronDownIcon className="size-3 stroke-brand stroke-2" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
