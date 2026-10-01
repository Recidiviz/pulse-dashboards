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

import { getLatestCompletedMeeting } from "./getLatestCompletedMeeting";

const meeting = (
  id: string,
  startTime: string,
  postMeetingProcessingStatus = "COMPLETED",
) => ({ id, startTime, postMeetingProcessingStatus });

describe("getLatestCompletedMeeting", () => {
  it("returns undefined when there are no meetings", () => {
    expect(getLatestCompletedMeeting(undefined)).toBeUndefined();
    expect(getLatestCompletedMeeting([])).toBeUndefined();
  });

  it("returns the most recent completed meeting", () => {
    const meetings = [
      meeting("a", "2026-07-01T10:00:00Z"),
      meeting("b", "2026-08-12T10:00:00Z"),
      meeting("c", "2026-06-01T10:00:00Z"),
    ];
    expect(getLatestCompletedMeeting(meetings)?.id).toBe("b");
  });

  it("skips meetings that are not completed", () => {
    const meetings = [
      meeting("a", "2026-07-01T10:00:00Z"),
      meeting("b", "2026-08-12T10:00:00Z", "NOTETAKING_IN_PROGRESS"),
    ];
    expect(getLatestCompletedMeeting(meetings)?.id).toBe("a");
  });
});
