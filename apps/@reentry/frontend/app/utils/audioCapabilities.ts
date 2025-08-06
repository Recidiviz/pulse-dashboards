// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import { SupportedAudioFormat } from "~@reentry/frontend/types/audio";

export const detectMediaRecorderSupport = (): boolean => {
  return typeof MediaRecorder !== "undefined";
};

export const detectSupportedAudioFormat = (): SupportedAudioFormat | null => {
  if (!detectMediaRecorderSupport()) return null;

  const formats = [SupportedAudioFormat.WEBM_OPUS, SupportedAudioFormat.WEBM];

  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) {
      return format;
    }
  }

  return null;
};
