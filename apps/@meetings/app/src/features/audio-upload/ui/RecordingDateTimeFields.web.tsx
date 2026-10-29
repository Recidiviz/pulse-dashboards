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
import { useCallback, useRef } from "react";
import { View } from "react-native";
import CalendarIcon from "react-native-heroicons/solid/CalendarIcon";
import ClockIcon from "react-native-heroicons/solid/ClockIcon";

import { useAudioUploadStore } from "../model/store";
import { PickerTrigger } from "./PickerTrigger";

type Props = {
  className?: string;
  /** Unused on web, where the fields open the browser's picker themselves. */
  onPick?: (mode: "date" | "time") => void;
};

/**
 * `@react-native-community/datetimepicker` renders nothing on web, so this
 * opens the browser's own picker from hidden inputs instead.
 */
export function RecordingDateTimeFields({ className }: Props) {
  const { recordingDate, recordingTime, setRecordingDate, setRecordingTime } =
    useAudioUploadStore();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      const [year, month, day] = e.target.value.split("-").map(Number);
      setRecordingDate(new Date(year, month - 1, day));
    },
    [setRecordingDate],
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      const [hours, minutes] = e.target.value.split(":").map(Number);
      const t = new Date();
      t.setHours(hours, minutes, 0, 0);
      setRecordingTime(t);
    },
    [setRecordingTime],
  );

  return (
    <View className={`flex-row gap-3 ${className ?? ""}`}>
      <View className="relative flex-1">
        <PickerTrigger
          icon={CalendarIcon}
          onPress={() => dateInputRef.current?.showPicker()}
        >
          {recordingDate ? format(recordingDate, "MMM d, yyyy") : "Select date"}
        </PickerTrigger>
        <input
          ref={dateInputRef}
          type="date"
          className="pointer-events-none absolute bottom-0 left-0 size-0 opacity-0"
          value={recordingDate ? format(recordingDate, "yyyy-MM-dd") : ""}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={handleDateChange}
        />
      </View>
      <View className="relative flex-1">
        <PickerTrigger
          icon={ClockIcon}
          onPress={() => timeInputRef.current?.showPicker()}
        >
          {recordingTime ? format(recordingTime, "h:mm a") : "Pick a time"}
        </PickerTrigger>
        <input
          ref={timeInputRef}
          type="time"
          className="pointer-events-none absolute bottom-0 left-0 size-0 opacity-0"
          value={recordingTime ? format(recordingTime, "HH:mm") : ""}
          onChange={handleTimeChange}
        />
      </View>
    </View>
  );
}
