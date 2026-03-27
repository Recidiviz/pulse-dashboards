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

import { FileValidationError } from "~@meetings/app/shared/errors";

import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE_BYTES } from "../constants";
import { FileInfo, RawFileInfo } from "../types";

export function deserializeFile(params: RawFileInfo): FileInfo {
  if (!params.mimeType) {
    throw new FileValidationError("Unknown file type");
  }

  // some browsers return "video/webm", even though the actual file is "audio/webm"
  const mimeType =
    params.mimeType === "video/webm" ? "audio/webm" : params.mimeType;

  if (!Object.keys(ALLOWED_AUDIO_TYPES).includes(mimeType)) {
    throw new FileValidationError("Unsupported file type");
  }

  if ((params.size || 0) > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError("File exceeds the 100 MB size limit");
  }

  return {
    uri: params.uri,
    name: params.name,
    mimeType,
    size: params.size ?? 0,
  };
}
