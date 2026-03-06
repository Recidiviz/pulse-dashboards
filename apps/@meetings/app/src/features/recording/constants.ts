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

export const MAX_RECORDING_MS = 90 * 60 * 1000; // 90min
export const WEB_CHUNK_INTERVAL_MS = 5000;

// Keep in sync with MOBILE_GCS_CONTENT_TYPE / WEB_GCS_CONTENT_TYPE in libs/@meetings/tasks/src/constants.ts
export const AUDIO_MIME_TYPES = {
  mobile: "audio/m4a",
  web: "audio/webm",
} as const;
