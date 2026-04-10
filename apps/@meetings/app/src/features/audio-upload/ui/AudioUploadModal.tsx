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

import Modal from "~@meetings/app/components/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../store";
import { RawFileInfo } from "../types";
import { DropZone } from "./DropZone.web";
import { FileCard } from "./FileCard";
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
          <Typography className="text-xl font-semibold text-primary">
            Upload audio
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
    </Modal>
  );
}
