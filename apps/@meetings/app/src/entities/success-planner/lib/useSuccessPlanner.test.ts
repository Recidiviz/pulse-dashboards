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

import { addDays } from "date-fns";

import {
  COMPLETED_PLANNER,
  IN_PROGRESS_PLANNER,
  NOT_STARTED_PLANNER,
} from "../api/mockSuccessPlanner";
import { canResendSuccessPlanner } from "./useSuccessPlanner";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("canResendSuccessPlanner", () => {
  const sentAt = COMPLETED_PLANNER.createdAt;

  test("a completed planner can't be resent until 90 days after it was sent", () => {
    expect(
      canResendSuccessPlanner(COMPLETED_PLANNER, addDays(sentAt, 89)),
    ).toBe(false);
  });

  test("a completed planner can be resent 90 days after it was sent", () => {
    expect(
      canResendSuccessPlanner(COMPLETED_PLANNER, addDays(sentAt, 90)),
    ).toBe(true);
  });

  test("an unfinished planner can never be resent", () => {
    const longAfter = addDays(sentAt, 365);
    expect(canResendSuccessPlanner(NOT_STARTED_PLANNER, longAfter)).toBe(false);
    expect(canResendSuccessPlanner(IN_PROGRESS_PLANNER, longAfter)).toBe(false);
  });
});
