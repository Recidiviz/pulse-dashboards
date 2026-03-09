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

import { Client, Resident } from "../../common/types";
import { SortOption, sortUsers } from "../../utils/sort";

const mockUsers = [
  {
    fullName: "Zelda",
    displayPersonExternalId: "102",
    primaryMetadata: "Facility B",
    meetingDetails: { lastCompletedMeetingTime: new Date("2023-01-01") },
  },
  {
    fullName: "Alice",
    displayPersonExternalId: "101",
    primaryMetadata: "Facility A",
    meetingDetails: { lastCompletedMeetingTime: new Date("2023-05-01") },
  },
  {
    fullName: "Bob",
    displayPersonExternalId: "103",
    primaryMetadata: "Facility C",
    meetingDetails: { lastCompletedMeetingTime: null },
  },
] as unknown as Array<Client | Resident>;

describe("sortUsers", () => {
  test("sorts by Name (A-Z)", () => {
    const result = sortUsers(mockUsers, SortOption.Name);
    expect(result[0].fullName).toBe("Alice");
    expect(result[2].fullName).toBe("Zelda");
  });

  test("sorts by ID numerically", () => {
    const result = sortUsers(mockUsers, SortOption.Id);
    expect(result[0].displayPersonExternalId).toBe("101");
    expect(result[1].displayPersonExternalId).toBe("102");
  });

  test("sorts by Facility (primaryMetadata)", () => {
    const result = sortUsers(mockUsers, SortOption.Facility);
    expect(result[0].primaryMetadata).toBe("Facility A");
    expect(result[2].primaryMetadata).toBe("Facility C");
  });

  test("sorts by Last Meeting (newest first, nulls at the end)", () => {
    const result = sortUsers(mockUsers, SortOption.LastMeeting);

    expect(result[0].fullName).toBe("Alice");
    expect(result[1].fullName).toBe("Zelda");
    expect(result[2].fullName).toBe("Bob");
  });

  test("returns a new array instance (immutability check)", () => {
    const result = sortUsers(mockUsers, SortOption.Name);
    expect(result).not.toBe(mockUsers);
  });
});
