// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  getSARCompletionState,
  isBeforeDueDate,
  isBeforeDueDateWithExtraDayOffset,
} from "../utils";

describe("isBeforeDueDate", () => {
  it("should return true if today is before due date", () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    expect(isBeforeDueDate(tomorrow)).toBe(true);
  });

  it("should return false if today is after due date", () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    expect(isBeforeDueDate(yesterday)).toBe(false);
  });

  it("should return true if today is the same as due date", () => {
    const today = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    expect(isBeforeDueDate(today)).toBe(true);
  });
});

test("isBeforeDueDateWithExtraDayOffset", () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const twoDaysAgo = new Date();
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

  expect(isBeforeDueDateWithExtraDayOffset(today)).toBe(true);
  expect(isBeforeDueDateWithExtraDayOffset(tomorrow)).toBe(true);
  expect(isBeforeDueDateWithExtraDayOffset(yesterday)).toBe(true);
  expect(isBeforeDueDateWithExtraDayOffset(twoDaysAgo)).toBe(false);
});

describe("getSARCompletionState", () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const updatedAt = new Date("2026-04-15");

  it("returns archivedInOpii whenever completionDate is set", () => {
    expect(
      getSARCompletionState({
        status: "Complete",
        completionDate: yesterday,
        updatedAt,
      }),
    ).toEqual({ kind: "archivedInOpii", date: yesterday });
  });

  it("returns archivedInOPii even when status hasn't reached Complete in-app", () => {
    // OPII closure is independent of in-app progress — MODOC can close the
    // investigation before a PO has finished the SAR in our tool.
    expect(
      getSARCompletionState({
        status: "InProgress",
        completionDate: yesterday,
        updatedAt,
      }),
    ).toEqual({ kind: "archivedInOpii", date: yesterday });
  });

  it("returns completeInApp when status is Complete but completionDate isn't set", () => {
    expect(
      getSARCompletionState({
        status: "Complete",
        completionDate: null,
        updatedAt,
      }),
    ).toEqual({ kind: "completeInApp", date: updatedAt });
  });

  it("returns active for any other status", () => {
    expect(
      getSARCompletionState({
        status: "InProgress",
        completionDate: null,
        updatedAt,
      }),
    ).toEqual({ kind: "active" });

    expect(
      getSARCompletionState({
        status: "NotYetStarted",
        completionDate: null,
        updatedAt,
      }),
    ).toEqual({ kind: "active" });
  });
});
