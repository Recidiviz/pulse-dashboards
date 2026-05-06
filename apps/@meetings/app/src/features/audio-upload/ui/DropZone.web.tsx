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

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import CloudUploadIcon from "react-native-heroicons/outline/CloudUploadIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";
import { AUDIO_FORMATS } from "~@meetings/config";

import { MAX_FILE_SIZE_BYTES } from "../config";
import { formatBytes } from "../lib/formatBytes";
import { RawFileInfo } from "../model/types";
import { useFilePicker } from "../model/useFilePicker";

type Props = {
  disabled?: boolean;
  onAddFile: (file: RawFileInfo) => void;
};

export function DropZone({ disabled, onAddFile }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<View>(null);
  const { pickFile } = useFilePicker();

  useEffect(() => {
    if (!dropRef.current || disabled) return;

    const el = dropRef.current as unknown as HTMLElement;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const acceptedMimeTypes = Object.values(AUDIO_FORMATS).flatMap(
      (f) => f.acceptedMimeTypes,
    );

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();

      setIsDragOver(false);
      const file = e.dataTransfer?.files[0];

      if (!file || !acceptedMimeTypes.includes(file.type)) return;

      onAddFile({
        uri: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
      });
    };

    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("dragleave", handleDragLeave);
    el.addEventListener("drop", handleDrop);

    return () => {
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("dragleave", handleDragLeave);
      el.removeEventListener("drop", handleDrop);
    };
  }, [disabled, onAddFile]);

  const handleBrowseFiles = useCallback(async () => {
    const result = await pickFile();
    if (result) onAddFile(result);
  }, [pickFile, onAddFile]);

  const allowedFormats = Object.values(AUDIO_FORMATS).map((f) => f.displayName);

  return (
    <View
      ref={dropRef}
      className={clsx(
        "items-center rounded-2xl border border-dashed px-6 py-8",
        {
          "border-subtle bg-secondary opacity-50": disabled,
          "border-brand bg-brand-light": isDragOver,
          "border-subtle bg-secondary": !isDragOver,
        },
      )}
    >
      <CloudUploadIcon className="mb-3 size-10 stroke-tertiary" />

      <Typography className="mb-1 text-center text-sm font-medium text-primary">
        Choose a file or drag & drop it here.
      </Typography>

      <Typography className="mb-4 text-center text-xs text-secondary">
        {allowedFormats.join(", ")} formats, up to{" "}
        {formatBytes(MAX_FILE_SIZE_BYTES, 0)}.
      </Typography>

      <TouchableOpacity onPress={handleBrowseFiles} disabled={disabled}>
        <Typography className="text-sm font-medium text-primary underline">
          Browse Files
        </Typography>
      </TouchableOpacity>
    </View>
  );
}
