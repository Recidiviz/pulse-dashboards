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

type Props = {
  isRecording: boolean;
  className?: string;
};

export function RecordingIndicator({ isRecording, className }: Props) {
  return (
    <View
      className={clsx(
        "flex size-2.5 items-center justify-center rounded-full",
        isRecording
          ? "animate-pulse bg-attention-light-secondary"
          : "animate-none bg-transparent",
        className,
      )}
    >
      <View
        className={clsx(
          "size-1.5 rounded-full",
          isRecording ? "bg-attention" : "bg-tertiary",
        )}
      />
    </View>
  );
}
