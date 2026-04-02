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
import { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useFilePicker } from "../hooks/useFilePicker";
import { useAudioUploadStore } from "../store";
import { RawFileInfo } from "../types";
import { FileCard } from "./FileCard";

type AudioUploadSheetProps = {
  onAddFile: (file: RawFileInfo) => void;
  onRemoveFile: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function AudioUploadSheet({
  onAddFile,
  onRemoveFile,
  onConfirm,
  onCancel,
}: AudioUploadSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { status, dialog, file, error, uploadedBytes, totalBytes } =
    useAudioUploadStore();
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

  const canConfirm = status === "uploaded" && file !== null && !isConfirming;

  return (
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
  );
}
