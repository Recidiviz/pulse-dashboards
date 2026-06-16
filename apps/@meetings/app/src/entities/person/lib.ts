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

import { format } from "date-fns";

import {
  Client,
  Person,
  PersonType,
  RawClient,
  RawResident,
  Resident,
} from "~@meetings/app/shared/api";
import { formatRelativeTime } from "~@meetings/app/shared/lib/format";

import { SortOption } from "./model";

export const getPersonType = (person: Person): PersonType => {
  return "supervisionType" in person ? "client" : "resident";
};

export const formatPersonLastMeetingDate = (date?: Date | null) =>
  date ? format(date, "EEEE, MMM dd") : null;

export const serializeSort = (sort: SortOption) => {
  switch (sort) {
    case SortOption.Name:
      return "name";
    case SortOption.Id:
      return "id";
    case SortOption.Facility:
      return "facility";
    case SortOption.SupervisionType:
      return "supervisionType";
    case SortOption.LastMeeting:
      return "lastMeeting";
  }
};

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
