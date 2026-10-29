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

import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, TouchableOpacity, View } from "react-native";

import { Sheet } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  date: Date | null;
  time: Date | null;
  mode: "date" | "time" | null;
  onClose: () => void;
  onDismissed?: () => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
};

export function RecordingDateTimePicker({
  date,
  time,
  mode,
  onClose,
  onDismissed,
  onDateChange,
  onTimeChange,
}: Props) {
  const handleValueChange = (_: unknown, selected: Date) => {
    if (Platform.OS === "android") onClose();

    if (mode === "date") {
      onDateChange(selected);
    } else {
      onTimeChange(selected);
    }
  };

  const value = (mode === "date" ? date : time) ?? new Date();
  const maxDate = mode === "date" ? new Date() : undefined;

  if (Platform.OS === "android" && !!mode) {
    return (
      <DateTimePicker
        mode={mode}
        value={value}
        maximumDate={maxDate}
        onValueChange={handleValueChange}
        onDismiss={onClose}
        display="default"
      />
    );
  }

  return (
    <Sheet
      visible={mode !== null}
      onClose={onClose}
      onDismissed={onDismissed}
      showDragIndicator={false}
    >
      <View className="pb-10">
        <View className="flex-row items-center justify-between px-6 pt-4">
          <Typography variant="button-l">
            {mode === "date" ? "Select date" : "Pick a time"}
          </Typography>
          <TouchableOpacity onPress={onClose}>
            <Typography variant="button-l" className="!text-brand">
              Done
            </Typography>
          </TouchableOpacity>
        </View>
        {mode !== null && (
          <View className="items-center">
            <DateTimePicker
              mode={mode}
              value={value}
              maximumDate={maxDate}
              onValueChange={handleValueChange}
              display="spinner"
            />
          </View>
        )}
      </View>
    </Sheet>
  );
}
