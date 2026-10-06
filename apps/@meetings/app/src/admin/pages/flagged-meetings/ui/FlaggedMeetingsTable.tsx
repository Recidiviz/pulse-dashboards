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

import { format, isSameYear } from "date-fns";
import { View } from "react-native";

import type { FlaggedMeetingSummary } from "~@meetings/app/admin/api/flaggedMeetings";
import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "~@meetings/app/shared/ui/Table.web";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import {
  type BadgeSpec,
  feedbackBadges,
  labelStudioBadges,
  llmBadges,
} from "../lib/flaggedMeetingBadges";

const HEADERS = [
  "Meeting",
  "State",
  "Date",
  "Staff",
  "LLM judge",
  "Label Studio",
  "In-app feedback",
];

function formatMeetingDate(date: Date): string {
  return format(date, isSameYear(date, new Date()) ? "MMM d" : "MMM d, yyyy");
}

const Badges = ({ badges }: { badges: BadgeSpec[] | null }) =>
  badges ? (
    <View className="flex-row flex-wrap gap-1 py-2">
      {badges.map((badge) => (
        <StatusBadge key={badge.label} tone={badge.tone} dot={badge.dot}>
          {badge.label}
        </StatusBadge>
      ))}
    </View>
  ) : (
    <Typography variant="body-s-regular">—</Typography>
  );

type FlaggedMeetingsTableProps = {
  meetings: FlaggedMeetingSummary[];
  onOpen: (meeting: FlaggedMeetingSummary) => void;
};

export const FlaggedMeetingsTable = ({
  meetings,
  onOpen,
}: FlaggedMeetingsTableProps) => (
  <Table>
    <TableHead>
      <TableHeadRow>
        {HEADERS.map((header) => (
          <TableHeadCell key={header} className="first:!pl-5 last:!pr-5">
            {header}
          </TableHeadCell>
        ))}
      </TableHeadRow>
    </TableHead>
    <TableBody>
      {meetings.map((meeting) => (
        <TableRow
          key={`${meeting.stateCode}-${meeting.meetingId}`}
          onClick={() => onOpen(meeting)}
        >
          <TableCell>
            <Typography
              variant="body-s-medium"
              className="font-mono !text-brand"
              numberOfLines={1}
            >
              {meeting.meetingId}
            </Typography>
          </TableCell>
          <TableCell>{meeting.stateCode.replace(/^US_/, "")}</TableCell>
          <TableCell>{formatMeetingDate(meeting.startTime)}</TableCell>
          <TableCell>{meeting.staffEmail}</TableCell>
          <TableCell>
            <Badges badges={llmBadges(meeting.llm)} />
          </TableCell>
          <TableCell>
            <Badges badges={labelStudioBadges(meeting.labelStudio)} />
          </TableCell>
          <TableCell>
            <Badges badges={feedbackBadges(meeting.votes)} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
