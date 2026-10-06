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

import { useMemo } from "react";
import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import type { TextDiffPart } from "../lib/textDiff";
import { diffText } from "../lib/textDiff";

const PART_CLASSES: Record<TextDiffPart["type"], string | undefined> = {
  added: "bg-[#00C49D33] text-primary",
  removed: "bg-[#B42D2D24] text-attention line-through",
  unchanged: undefined,
};

/**
 * The staff member's edits to the generated case note, which is the clearest
 * signal of what the pipeline got wrong: word-level additions and deletions
 * between the generated text and what they left behind.
 */
export function CaseNoteDiff({
  original,
  edited,
}: {
  original: string;
  edited: string;
}) {
  const { parts, tooLarge } = useMemo(
    () => diffText(original, edited),
    [original, edited],
  );

  if (tooLarge) {
    return (
      <View className="gap-3">
        <Typography variant="caption-s-regular" className="text-tertiary">
          This case note is too long to diff; showing both versions.
        </Typography>
        <View className="gap-1">
          <Typography variant="caption-s-medium" className="text-tertiary">
            Generated
          </Typography>
          <Typography variant="body-s-regular">{original}</Typography>
        </View>
        <View className="gap-1">
          <Typography variant="caption-s-medium" className="text-tertiary">
            After edits
          </Typography>
          <Typography variant="body-s-regular">{edited}</Typography>
        </View>
      </View>
    );
  }

  return (
    <Typography variant="body-s-regular">
      {parts.map((part, index) => (
        <Typography
          // Parts have no stable identity of their own, and the list is
          // rebuilt wholesale whenever either side changes.

          key={index}
          variant="body-s-regular"
          className={PART_CLASSES[part.type]}
        >
          {part.value}
        </Typography>
      ))}
    </Typography>
  );
}
