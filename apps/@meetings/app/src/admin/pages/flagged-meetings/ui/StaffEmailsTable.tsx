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
import { Pressable, View } from "react-native";

import type { StaffEmailTask } from "~@meetings/app/admin/api/flaggedMeetings";
import { SECTION_LABEL } from "~@meetings/app/admin/entities/flagged-meeting-review";
import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import { Button } from "~@meetings/app/shared/ui/Button";
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

const HEADERS = [
  "Meeting",
  "State",
  "Date",
  "Staff",
  "Outcome",
  "Reviewer notes",
  "Email",
];

function formatShortDate(date: Date): string {
  return format(date, isSameYear(date, new Date()) ? "MMM d" : "MMM d, yyyy");
}

type StaffEmailsTableProps = {
  emails: StaffEmailTask[];
  onOpen: (email: StaffEmailTask) => void;
  onSetSent: (email: StaffEmailTask, sent: boolean) => void;
  /** The outcome whose sent state is being saved, to disable its button. */
  pendingOutcomeId: string | null;
};

export const StaffEmailsTable = ({
  emails,
  onOpen,
  onSetSent,
  pendingOutcomeId,
}: StaffEmailsTableProps) => (
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
      {emails.map((email) => (
        <TableRow key={email.outcomeId} onClick={() => onOpen(email)}>
          <TableCell>
            <Typography
              variant="body-s-medium"
              className="font-mono !text-brand"
              numberOfLines={1}
            >
              {email.meetingId}
            </Typography>
          </TableCell>
          <TableCell>{email.stateCode.replace(/^US_/, "")}</TableCell>
          <TableCell>
            {email.startTime ? formatShortDate(email.startTime) : "—"}
          </TableCell>
          <TableCell>{email.staffEmail ?? "—"}</TableCell>
          <TableCell>
            <View className="items-start gap-1 py-2">
              <StatusBadge
                tone={email.outcome === "CONFIRMED_BAD" ? "bad" : "info"}
              >
                {email.outcome === "CONFIRMED_BAD"
                  ? "Confirmed BAD"
                  : "Not BAD"}
              </StatusBadge>
              <Typography
                variant="caption-s-regular"
                className="!text-tertiary"
              >
                {SECTION_LABEL[email.section]}
              </Typography>
            </View>
          </TableCell>
          <TableCell>
            <View className="gap-0.5 py-2">
              <Typography variant="body-s-regular">
                {email.notes ?? "No notes"}
              </Typography>
              <Typography
                variant="caption-s-regular"
                className="!text-tertiary"
              >
                {`${email.reviewerEmail} · ${formatShortDate(email.recordedAt)}`}
              </Typography>
            </View>
          </TableCell>
          {/* Its buttons act on the email, so clicks here don't open the meeting. */}
          <TableCell onClick={(e) => e.stopPropagation()}>
            {email.sentAt ? (
              <View className="items-end gap-0.5 py-2">
                <StatusBadge tone="good">
                  {`Sent${email.sentBy ? ` by ${email.sentBy}` : ""} · ${formatShortDate(email.sentAt)}`}
                </StatusBadge>
                <Pressable
                  accessibilityRole="button"
                  disabled={pendingOutcomeId === email.outcomeId}
                  onPress={() => onSetSent(email, false)}
                >
                  <Typography
                    variant="caption-s-medium"
                    className="!text-brand"
                  >
                    Undo
                  </Typography>
                </Pressable>
              </View>
            ) : (
              <Button
                variant="secondary"
                className="self-end"
                loading={pendingOutcomeId === email.outcomeId}
                onPress={() => onSetSent(email, true)}
              >
                Mark as sent
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
