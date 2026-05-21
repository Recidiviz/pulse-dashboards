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

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { DEFAULT_MEETING_TYPE } from "../config";
import { getMeetingTypeStyles } from "../lib";

export function MeetingTypeTag({ type }: { type: string | null }) {
  if (!type || type === DEFAULT_MEETING_TYPE) return null;

  const tagStyles = getMeetingTypeStyles(type);

  return (
    <Typography
      style={tagStyles}
      className="w-fit rounded-lg px-2 py-0.5 text-sm font-normal"
    >
      {type}
    </Typography>
  );
}
