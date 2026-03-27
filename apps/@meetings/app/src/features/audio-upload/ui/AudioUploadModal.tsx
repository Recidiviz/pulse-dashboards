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

import Modal from "~@meetings/app/components/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useAudioUploadStore } from "../store";
import { RawFileInfo } from "../types";
import { DropZone } from "./DropZone.web";
import { FileCard } from "./FileCard";

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
  const { status, file, error, uploadedBytes, totalBytes } =
    useAudioUploadStore();

  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }, [onConfirm]);

  const isUploading = status === "uploading";
  const canConfirm = status === "uploaded" && file !== null && !isConfirming;

  return (
    <Modal visible transparent onClickOutside={onCancel}>
      <View className="w-[520px] p-6">
        <View className="mb-1 flex-row items-center justify-between">
          <Typography className="text-xl font-semibold text-primary">
            Upload audio
          </Typography>
          <TouchableOpacity onPress={onCancel} className="p-1">
            <XIcon className="stroke-muted size-5" />
          </TouchableOpacity>
        </View>

        <Typography className="mb-5 text-sm text-secondary">
          Use an existing audio file to generate meeting
        </Typography>

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
