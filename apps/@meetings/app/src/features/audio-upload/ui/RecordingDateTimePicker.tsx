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

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef } from "react";
import { Platform, TouchableOpacity, View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  date: Date | null;
  time: Date | null;
  mode: "date" | "time" | null;
  onClose: () => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
};

export function RecordingDateTimePicker({
  date,
  time,
  mode,
  onClose,
  onDateChange,
  onTimeChange,
}: Props) {
  const iosSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (mode === null) {
      iosSheetRef.current?.dismiss();
    } else {
      iosSheetRef.current?.present();
    }
  }, [mode]);

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
    <BottomSheetModal
      ref={iosSheetRef}
      enableDynamicSizing
      handleComponent={null}
      enableContentPanningGesture={false}
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.3}
          pressBehavior="collapse"
        />
      )}
    >
      <BottomSheetView>
        <View className="pb-10">
          <View className="flex-row items-center justify-between px-6 pt-4">
            <Typography className="text-base font-semibold text-primary">
              {mode === "date" ? "Select date" : "Pick a time"}
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <Typography className="text-base font-semibold text-brand">
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
      </BottomSheetView>
    </BottomSheetModal>
  );
}
