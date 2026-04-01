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

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

// TODO: expand allowed mime types
export const ALLOWED_AUDIO_TYPES = {
  "audio/webm": "WebM",
  "audio/m4a": "M4A",
  "audio/x-m4a": "M4A", // ios
  "audio/mp4a-latm": "M4A", // android
} as const;
