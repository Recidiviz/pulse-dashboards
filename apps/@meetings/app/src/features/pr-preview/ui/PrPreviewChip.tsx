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

import { ActivityIndicator, TouchableOpacity } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { theme } from "~@meetings/app/shared/config";
import { Typography } from "~@meetings/app/shared/ui/Typography";

interface PrPreviewChipProps {
  channel: string;
  onPress: () => void;
  isExiting: boolean;
}

// Compact chip in the header nav row; tapping it prompts to exit the preview.
export const PrPreviewChip = ({
  channel,
  onPress,
  isExiting,
}: PrPreviewChipProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={isExiting}
    className="flex-row items-center gap-1 rounded-full bg-attention px-2.5 py-1"
  >
    <Typography className="text-xs font-medium text-on-attention">
      {channel}
    </Typography>
    {isExiting ? (
      <ActivityIndicator size="small" color={theme["colors"]["on-attention"]} />
    ) : (
      <XIcon size={14} className="stroke-on-attention" />
    )}
  </TouchableOpacity>
);
