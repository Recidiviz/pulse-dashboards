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

import { ComponentProps, useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Sheet, SheetScrollView } from "~@meetings/app/shared/ui/Sheet";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";
import { RawFileInfo } from "../model/types";
import { useFilePicker } from "../model/useFilePicker";
import { FileCard } from "./FileCard";
import { NotesSheet } from "./NotesSheet";
import { RecordingDateTimeFields } from "./RecordingDateTimeFields";
import { RecordingDateTimePicker } from "./RecordingDateTimePicker";

type AudioUploadSheetProps = {
  onAddFile: (file: RawFileInfo) => void;
  onRemoveFile: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  onScreenChange: (isOnScreen: boolean) => void;
};

type PickerMode = NonNullable<
  ComponentProps<typeof RecordingDateTimePicker>["mode"]
>;

export function AudioUploadSheet({
  onAddFile,
  onRemoveFile,
  onConfirm,
  onCancel,
  onScreenChange,
}: AudioUploadSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  // "closing" until the notes have animated out
  const [notesSheet, setNotesSheet] = useState<"open" | "closing" | null>(null);
  const [pickerSheet, setPickerSheet] = useState<{
    mode: PickerMode;
    isClosing: boolean;
  } | null>(null);
  const isIOS = Platform.OS === "ios";
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

  // Hidden while the file picker, a dialog or the notes are open.
  const isSheetVisible =
    status !== "selecting" &&
    dialog === null &&
    notesSheet === null &&
    !(isIOS && pickerSheet !== null);

  useEffect(() => {
    if (isSheetVisible) onScreenChange(true);
  }, [isSheetVisible, onScreenChange]);

  useEffect(() => () => onScreenChange(false), [onScreenChange]);

  const canConfirm =
    status === "uploaded" &&
    file !== null &&
    !isConfirming &&
    recordingDate !== null &&
    recordingTime !== null;

  return (
    <>
      <Sheet
        visible={isSheetVisible}
        onClose={onCancel}
        onDismissed={() => onScreenChange(false)}
        showDragIndicator={false}
      >
        <SheetScrollView>
          <View className="p-6">
            <View className="mb-1 flex-row items-center justify-between">
              <Typography variant="heading-4">Upload audio</Typography>
              <Button
                variant="secondary"
                shape="circle"
                icon={{ icon: XIcon }}
                onPress={onCancel}
              />
            </View>

            <Typography variant="body-s-regular">
              Use an existing audio file to generate a meeting
            </Typography>

            <Typography variant="body-s-regular" className="mt-5 !text-primary">
              Date and time of the meeting recording
            </Typography>
            <RecordingDateTimeFields
              className="mt-4"
              onPick={(mode) => setPickerSheet({ mode, isClosing: false })}
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
              <Typography variant="body-s-regular" className="mt-3">
                {error}
              </Typography>
            )}

            {meetingId && (
              <View className="mt-4 flex w-full flex-row items-center gap-2">
                <NotesSvg className="!size-6 stroke-secondary" />
                <View className="flex flex-col">
                  <Typography variant="body-m-medium">
                    Notes from this meeting (optional)
                  </Typography>
                  <Typography variant="caption-s-regular">
                    Add any notes you took during the meeting
                  </Typography>
                </View>
                <Button
                  variant="secondary"
                  className="ml-auto px-3 py-2"
                  onPress={() => setNotesSheet("open")}
                >
                  Add
                </Button>
              </View>
            )}

            <Button
              variant="primary"
              className="mt-6 py-4 disabled:bg-disabled aria-disabled:bg-disabled"
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              Confirm
            </Button>
          </View>
        </SheetScrollView>
      </Sheet>
      {Platform.OS !== "web" && (
        <RecordingDateTimePicker
          date={recordingDate}
          time={recordingTime}
          mode={pickerSheet && !pickerSheet.isClosing ? pickerSheet.mode : null}
          onClose={() =>
            setPickerSheet((sheet) =>
              sheet && isIOS ? { ...sheet, isClosing: true } : null,
            )
          }
          onDismissed={() => setPickerSheet(null)}
          onDateChange={setRecordingDate}
          onTimeChange={setRecordingTime}
        />
      )}
      <NotesSheet
        visible={notesSheet === "open"}
        onClose={() => setNotesSheet("closing")}
        onDismissed={() => setNotesSheet(null)}
      />
    </>
  );
}
