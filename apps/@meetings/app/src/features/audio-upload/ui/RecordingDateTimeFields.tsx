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

import { format } from "date-fns";
import { View } from "react-native";
import CalendarIcon from "react-native-heroicons/solid/CalendarIcon";
import ClockIcon from "react-native-heroicons/solid/ClockIcon";

import { useAudioUploadStore } from "../model/store";
import { PickerTrigger } from "./PickerTrigger";

type Props = {
  className?: string;
  onPick?: (mode: "date" | "time") => void;
};

export function RecordingDateTimeFields({ className, onPick }: Props) {
  const { recordingDate, recordingTime } = useAudioUploadStore();

  return (
    <View className={`flex-row gap-3 ${className ?? ""}`}>
      <PickerTrigger icon={CalendarIcon} onPress={() => onPick?.("date")}>
        {recordingDate ? format(recordingDate, "MMM d, yyyy") : "Select date"}
      </PickerTrigger>
      <PickerTrigger icon={ClockIcon} onPress={() => onPick?.("time")}>
        {recordingTime ? format(recordingTime, "h:mm a") : "Pick a time"}
      </PickerTrigger>
    </View>
  );
}
