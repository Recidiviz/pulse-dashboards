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

import { format } from "date-fns";

import { Client, RawClient, RawResident, Resident } from "../common/types";
import { formatRelativeTime } from "../shared/lib/format";

export const formatDraftCaseNoteMeetingDate = (date: Date) => {
  return format(date, "MMM d");
};

export const deserializeClient = (rawClient: RawClient): Client => {
  return {
    ...rawClient,
    fullName: `${rawClient.givenNames} ${rawClient.surname}`,
    primaryMetadata: rawClient.supervisionType,
    lastMeeting:
      rawClient.meetingDetails.lastCompletedMeetingTime == null
        ? "No meetings"
        : formatRelativeTime(rawClient.meetingDetails.lastCompletedMeetingTime),
  };
};

export const deserializeResident = (rawResident: RawResident): Resident => {
  return {
    ...rawResident,
    fullName: `${rawResident.givenNames} ${rawResident.surname}`,
    primaryMetadata: rawResident.facilityId,
    lastMeeting:
      rawResident.meetingDetails.lastCompletedMeetingTime == null
        ? "No meetings"
        : formatRelativeTime(
            rawResident.meetingDetails.lastCompletedMeetingTime,
          ),
  };
};

export const formatMeetingStartDate = (date: Date) => {
  return format(date, "MMMM d, yyyy");
};

export const formatMeetingDuration = ({
  startDate,
  endDate,
  durationMs,
}: {
  startDate: Date | null;
  endDate: Date | null;
  durationMs: number | null;
}) => {
  if (!startDate) {
    return { time: null, duration: null };
  }

  const startTimeFormatted = format(startDate, "HH:mm");
  const endTimeFormatted = endDate ? format(endDate, "HH:mm") : "";
  const timeFormatted = endTimeFormatted
    ? `${startTimeFormatted} - ${endTimeFormatted}`
    : startTimeFormatted;

  const durationInMs =
    durationMs ?? (endDate ? endDate.getTime() - startDate.getTime() : null);

  if (durationInMs == null) {
    return { time: timeFormatted, duration: null };
  }

  const differenceInSeconds = Math.floor(durationInMs / 1000);
  const duration =
    differenceInSeconds < 60
      ? `${differenceInSeconds} sec`
      : `${Math.floor(differenceInSeconds / 60)} min`;

  return { time: timeFormatted, duration };
};

export const formatMeetingStartDateTitle = (startDate: Date) =>
  `${format(startDate, "MM/dd/yy")} at ${format(startDate, "HH:mm")}`;

export const formatPersonTitle = ({
  fullName,
  givenNames,
  surname,
  displayPersonExternalId,
}: {
  fullName?: string;
  givenNames?: string;
  surname?: string;
  displayPersonExternalId?: string;
}) => {
  if (fullName) {
    return `${fullName} | ${displayPersonExternalId}`;
  } else {
    return `${givenNames} ${surname} | ${displayPersonExternalId}`;
  }
};

export const formatPersonLastMeetingDate = (date?: Date | null) =>
  date ? format(date, "EEEE, MMM dd") : null;
