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

import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

const recordProcessingStatuses = [
  "STITCHING_QUEUED",
  "STITCHING_IN_PROGRESS",
  "TRANSCRIPTION_QUEUED",
  "TRANSCRIPTION_IN_PROGRESS",
  "NOTETAKING_QUEUED",
  "NOTETAKING_IN_PROGRESS",
];

export function isMeetingProcessing(status: PostMeetingProcessingStatus) {
  return recordProcessingStatuses.includes(status);
}
