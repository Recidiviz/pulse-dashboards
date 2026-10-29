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

import { useCallback, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";
import NotesSvg from "~@meetings/app/shared/assets/icons/notes.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../model/store";
import { RawFileInfo } from "../model/types";
import { DropZone } from "./DropZone.web";
import { FileCard } from "./FileCard";
import { NotesModal } from "./NotesModal";
import { RecordingDateTimeFields } from "./RecordingDateTimeFields";

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
    meetingTypeCategory,
    status,
    file,
    error,
    uploadedBytes,
    totalBytes,
    recordingDate,
    recordingTime,
  } = useAudioUploadStore();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

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
          <Typography
            variant="heading-4"
            className="flex flex-row items-center gap-2"
          >
            Upload audio{" "}
            <MeetingTypeTag
              type={meetingType}
              typeCategory={meetingTypeCategory}
            />
          </Typography>
          <TouchableOpacity onPress={onCancel} className="p-1">
            <XIcon className="size-5 stroke-tertiary" />
          </TouchableOpacity>
        </View>

        <Typography variant="body-s-regular" className="mb-5">
          Use an existing audio file to generate a meeting
        </Typography>

        <Typography variant="body-s-medium" className="mb-2">
          Date and time of the meeting recording
        </Typography>
        <RecordingDateTimeFields className="mb-4" />

        <DropZone onAddFile={onAddFile} disabled={isUploading} />

        {meetingId && (
          <View className="mt-5 flex w-full flex-row items-center gap-3">
            <NotesSvg className="size-6 text-secondary" />
            <View className="flex flex-col">
              <Typography variant="body-m-medium">
                Notes from this meeting (optional)
              </Typography>
              <Typography variant="body-s-regular">
                Add any notes you took during the meeting
              </Typography>
            </View>
            <Button
              variant="secondary"
              className="ml-auto px-3 py-2"
              onPress={() => setIsNotesModalOpen(true)}
            >
              Add
            </Button>
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
          <Typography variant="body-s-regular" className="mt-3">
            {error}
          </Typography>
        )}

        <View className="mt-6 flex-row items-center justify-end gap-3">
          <TouchableOpacity
            className="rounded-full bg-primary px-6 py-3"
            onPress={onCancel}
            disabled={isUploading || isConfirming}
          >
            <Typography variant="body-s-medium">Close</Typography>
          </TouchableOpacity>

          <Button
            variant="primary"
            className="px-6 py-3 aria-disabled:bg-disabled"
            onPress={handleConfirm}
            disabled={!canConfirm}
          >
            Confirm
          </Button>
        </View>
      </View>
      {isNotesModalOpen && (
        <NotesModal onClose={() => setIsNotesModalOpen(false)} />
      )}
    </Modal>
  );
}
