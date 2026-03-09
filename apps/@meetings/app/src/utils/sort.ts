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

import { isBefore } from "date-fns";

import { Person } from "../common/types";

export enum SortOption {
  Name = "Name (A-Z)",
  Id = "ID",
  Facility = "Facility (A-Z)",
  SupervisionType = "Supervision Type (A-Z)",
  LastMeeting = "Last Meeting",
}

export const sortUsers = <T extends Person>(users: T[], option: SortOption) => {
  const sortedUsers = [...users];
  if (option === SortOption.Name) {
    return sortedUsers.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  if (option === SortOption.Id) {
    return sortedUsers.sort(
      (a, b) =>
        Number(a.displayPersonExternalId) - Number(b.displayPersonExternalId),
    );
  }
  if (option === SortOption.Facility || option === SortOption.SupervisionType) {
    return sortedUsers.sort((a, b) =>
      a.primaryMetadata.localeCompare(b.primaryMetadata),
    );
  }
  if (option === SortOption.LastMeeting) {
    return sortedUsers.sort((a, b) => {
      if (a.meetingDetails.lastCompletedMeetingTime === null) {
        return 1;
      }
      if (b.meetingDetails.lastCompletedMeetingTime === null) {
        return -1;
      }
      return isBefore(
        a.meetingDetails.lastCompletedMeetingTime,
        b.meetingDetails.lastCompletedMeetingTime,
      )
        ? 1
        : -1;
    });
  }
  return sortedUsers;
};
