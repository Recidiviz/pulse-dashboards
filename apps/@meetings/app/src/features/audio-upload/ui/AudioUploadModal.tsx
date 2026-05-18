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
import { useCallback, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import CalendarIcon from "react-native-heroicons/solid/CalendarIcon";
import ClockIcon from "react-native-heroicons/solid/ClockIcon";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";
import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";
import { RawFileInfo } from "../model/types";
import { DropZone } from "./DropZone.web";
import { FileCard } from "./FileCard";
import { NotesModal } from "./NotesModal";
import { PickerTrigger } from "./PickerTrigger";

type Props = {
  onAddFile: (file: RawFileInfo) => void;
  onRemoveFile: () => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function AudioUploadModal({
  onAddFile,
  onRemoveFile,
  onConfirm,
  onCancel,
}: Props) {
  const {
    meetingId,
    meetingType,
    status,
    file,
    error,
    uploadedBytes,
    totalBytes,
    recordingDate,
    recordingTime,
    setRecordingDate,
    setRecordingTime,
  } = useAudioUploadStore();

  const [isConfirming, setIsConfirming] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

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

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }, [onConfirm]);

  const isUploading = status === "uploading";
  const canConfirm =
    status === "uploaded" &&
    file !== null &&
    !isConfirming &&
    recordingDate !== null &&
    recordingTime !== null;

  return (
    <Modal visible transparent onClickOutside={onCancel}>
      <View className="w-[520px] p-6">
        <View className="mb-1 flex-row items-center justify-between">
          <Typography className="flex flex-row items-center gap-2 text-xl font-semibold text-primary">
            Upload audio <MeetingTypeTag type={meetingType} />
          </Typography>
          <TouchableOpacity onPress={onCancel} className="p-1">
            <XIcon className="size-5 stroke-tertiary" />
          </TouchableOpacity>
        </View>

        <Typography className="mb-5 text-sm text-secondary">
          Use an existing audio file to generate a meeting
        </Typography>

        <Typography className="mb-2 text-sm font-medium text-primary">
          Date and time of the meeting recording
        </Typography>
        <View className="mb-4 flex-row gap-3">
          <View className="relative flex-1">
            <PickerTrigger
              icon={CalendarIcon}
              onPress={() => dateInputRef.current?.showPicker()}
            >
              {recordingDate
                ? format(recordingDate, "MMM d, yyyy")
                : "Select date"}
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

        <DropZone onAddFile={onAddFile} disabled={isUploading} />

        {meetingId && (
          <View className="mt-5 flex w-full flex-row items-center gap-3">
            <NotesSvg className="size-6 text-secondary" />
            <View className="flex flex-col">
              <Typography className="text-base font-medium text-primary">
                Notes from this meeting (optional)
              </Typography>
              <Typography className="text-sm font-normal text-secondary">
                Add any notes you took during the meeting
              </Typography>
            </View>
            <TouchableOpacity
              className="ml-auto rounded-full bg-secondary px-3 py-2"
              onPress={() => setIsNotesModalOpen(true)}
            >
              <Typography className="text-sm leading-4 text-primary">
                Add
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {file && (
          <FileCard
            file={file}
            status={status}
            uploadedBytes={uploadedBytes}
            totalBytes={totalBytes}
            error={error}
            onRemove={onRemoveFile}
          />
        )}

        {error && (
          <Typography className="mt-3 text-sm text-secondary">
            {error}
          </Typography>
        )}

        <View className="mt-6 flex-row items-center justify-end gap-3">
          <TouchableOpacity
            className="rounded-full bg-primary px-6 py-3"
            onPress={onCancel}
            disabled={isUploading || isConfirming}
          >
            <Typography className="text-sm font-medium text-primary">
              Close
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full bg-brand px-6 py-3 text-on-brand aria-disabled:bg-disabled"
            onPress={handleConfirm}
            disabled={!canConfirm}
          >
            <Typography
              className={`text-sm font-medium ${canConfirm ? "text-on-brand" : "text-on-disabled"}`}
            >
              Confirm
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      {isNotesModalOpen && (
        <NotesModal onClose={() => setIsNotesModalOpen(false)} />
      )}
    </Modal>
  );
}
