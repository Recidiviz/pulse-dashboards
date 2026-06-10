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

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { format } from "date-fns";
import { ComponentProps, useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import CalendarIcon from "react-native-heroicons/solid/CalendarIcon";
import ClockIcon from "react-native-heroicons/solid/ClockIcon";

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";
import { RawFileInfo } from "../model/types";
import { useFilePicker } from "../model/useFilePicker";
import { FileCard } from "./FileCard";
import { NotesSheet } from "./NotesSheet";
import { PickerTrigger } from "./PickerTrigger";
import { RecordingDateTimePicker } from "./RecordingDateTimePicker";

type AudioUploadSheetProps = {
  onAddFile: (file: RawFileInfo) => void;
  onRemoveFile: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

type PickerMode = ComponentProps<typeof RecordingDateTimePicker>["mode"];

export function AudioUploadSheet({
  onAddFile,
  onRemoveFile,
  onConfirm,
  onCancel,
}: AudioUploadSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);
  const {
    meetingId,
    status,
    dialog,
    file,
    error,
    uploadedBytes,
    totalBytes,
    recordingDate,
    recordingTime,
    setRecordingDate,
    setRecordingTime,
  } = useAudioUploadStore();
  const { pickFile } = useFilePicker();

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }, [onConfirm]);

  useEffect(() => {
    if (status !== "selecting" || dialog !== null) return;

    // Defer to the next macrotask so expo-document-picker's native module
    // can reset its internal presentation state. Without this, the picker
    // silently refuses to open after a previous dismissal.
    const timeout = setTimeout(async () => {
      const result = await pickFile();
      if (result) onAddFile(result);
      else onCancel();
    }, 0);

    return () => clearTimeout(timeout);
  }, [status, dialog, pickFile, onAddFile, onCancel]);

  const onRemove = async () => {
    await onRemoveFile();
    onCancel();
  };

  const canConfirm =
    status === "uploaded" &&
    file !== null &&
    !isConfirming &&
    recordingDate !== null &&
    recordingTime !== null;

  return (
    <>
      <BottomSheet
        enableDynamicSizing
        handleComponent={null}
        enableContentPanningGesture={false}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="collapse"
            onPress={onCancel}
          />
        )}
      >
        <BottomSheetView>
          <View className="p-6 pb-10">
            <View className="mb-1 flex-row items-center justify-between">
              <Typography className="text-xl font-semibold text-primary">
                Upload audio
              </Typography>
              <TouchableOpacity
                onPress={onCancel}
                className="rounded-full bg-secondary p-3"
              >
                <XIcon className="size-5 stroke-tertiary" />
              </TouchableOpacity>
            </View>

            <Typography className="text-sm text-secondary">
              Use an existing audio file to generate a meeting
            </Typography>

            <Typography className="mt-5 text-sm text-primary">
              Date and time of the meeting recording
            </Typography>
            <View className="mt-4 flex-row gap-3">
              <PickerTrigger
                icon={CalendarIcon}
                onPress={() => setPickerMode("date")}
              >
                {recordingDate
                  ? format(recordingDate, "MMM d, yyyy")
                  : "Select date"}
              </PickerTrigger>
              <PickerTrigger
                icon={ClockIcon}
                onPress={() => setPickerMode("time")}
              >
                {recordingTime
                  ? format(recordingTime, "h:mm a")
                  : "Pick a time"}
              </PickerTrigger>
            </View>
            <RecordingDateTimePicker
              date={recordingDate}
              time={recordingTime}
              mode={pickerMode}
              onClose={() => setPickerMode(null)}
              onDateChange={setRecordingDate}
              onTimeChange={setRecordingTime}
            />

            {file && (
              <FileCard
                file={file}
                status={status}
                uploadedBytes={uploadedBytes}
                totalBytes={totalBytes}
                error={error}
                onRemove={onRemove}
              />
            )}

            {error && (
              <Typography className="mt-3 text-sm text-secondary">
                {error}
              </Typography>
            )}

            {meetingId && (
              <View className="mt-4 flex w-full flex-row items-center gap-2">
                <NotesSvg className="!size-6 stroke-secondary" />
                <View className="flex flex-col">
                  <Typography className="text-base font-medium text-primary">
                    Notes from this meeting (optional)
                  </Typography>
                  <Typography className="text-xs font-normal text-secondary">
                    Add any notes you took during the meeting
                  </Typography>
                </View>
                <TouchableOpacity
                  onPress={() => setIsNotesSheetOpen(true)}
                  className="ml-auto rounded-full bg-secondary px-3 py-2"
                >
                  <Typography className="text-sm leading-4 text-primary">
                    Add
                  </Typography>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              className="mt-6 items-center rounded-full bg-brand py-4 disabled:bg-disabled aria-disabled:bg-disabled"
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Typography className="text-base font-semibold text-on-brand">
                Confirm
              </Typography>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
      {isNotesSheetOpen && (
        <NotesSheet onClose={() => setIsNotesSheetOpen(false)} />
      )}
    </>
  );
}
