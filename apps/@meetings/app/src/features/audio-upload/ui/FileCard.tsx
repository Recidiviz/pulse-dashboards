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

import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import TrashIcon from "react-native-heroicons/outline/TrashIcon";
import XIcon from "react-native-heroicons/outline/XIcon";
import CheckCircleIcon from "react-native-heroicons/solid/CheckCircleIcon";
import ExclamationCircleIcon from "react-native-heroicons/solid/ExclamationCircleIcon";

import { theme } from "~@meetings/app/shared/config";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatBytes } from "../lib/formatBytes";
import { AudioUploadStatus, FileInfo } from "../model/types";
import { FileIcon } from "./FileIcon";

type FileCardProps = {
  file: FileInfo;
  status: AudioUploadStatus;
  uploadedBytes: number;
  totalBytes: number;
  error: string | null;
  onRemove: () => void;
};

export function FileCard({
  file,
  status,
  uploadedBytes,
  totalBytes,
  error,
  onRemove,
}: FileCardProps) {
  const isUploading = status === "uploading";
  const isCompleted = status === "uploaded";
  const isError = !!error;

  const progressPercent =
    isUploading && totalBytes > 0
      ? Math.round((uploadedBytes / totalBytes) * 100)
      : 0;

  return (
    <View className="mt-4 rounded-xl border border-subtle bg-white px-4 py-3">
      <View className="flex-row items-center gap-4">
        <View className="size-10 items-center justify-center rounded-lg bg-brand-light">
          <FileIcon extension={file.extension} />
        </View>

        <View className="flex-1 gap-1">
          <Typography
            className="text-sm font-medium text-primary"
            numberOfLines={1}
          >
            {file.name}
          </Typography>

          <View className="flex-row items-center gap-1">
            {isUploading && (
              <View className="flex-row items-center gap-3">
                <Typography className="text-xs text-secondary">
                  {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                </Typography>
                <Typography className="text-xs text-secondary">•</Typography>
                <View className="flex-row items-center gap-1">
                  <ActivityIndicator
                    size={12}
                    color={theme["colors"]["tertiary"]}
                  />
                  <Typography className="text-xs text-secondary">
                    Uploading..
                  </Typography>
                </View>
              </View>
            )}

            {isCompleted && (
              <View className="flex-row items-center gap-3">
                <Typography className="text-xs text-secondary">
                  {formatBytes(file.size)}
                </Typography>
                <Typography className="text-xs text-secondary">•</Typography>
                <View className="flex-row items-center gap-1">
                  <CheckCircleIcon className="size-4 fill-brand" />
                  <Typography className="text-xs text-brand">
                    Uploaded
                  </Typography>
                </View>
              </View>
            )}

            {isError && (
              <>
                <ExclamationCircleIcon className="size-4 fill-attention" />
                <Typography className="text-xs text-attention">
                  Upload failed
                </Typography>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={onRemove} className="p-1">
          {isCompleted ? (
            <TrashIcon className="size-5 stroke-primary" />
          ) : (
            <XIcon className="size-5 stroke-primary" />
          )}
        </TouchableOpacity>
      </View>

      {isUploading && (
        <View className="mt-2 h-0.5 overflow-hidden rounded-full bg-secondary">
          <View
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      )}
    </View>
  );
}
