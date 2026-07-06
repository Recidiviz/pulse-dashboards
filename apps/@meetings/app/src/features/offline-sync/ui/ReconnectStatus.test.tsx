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

import { render, screen } from "@testing-library/react-native";
import React from "react";

import { Person } from "~@meetings/app/shared/api";

import { ReconnectRow } from "./ReconnectStatus";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockPerson = {
  personId: BigInt(1),
  fullName: "Test Person",
  displayPersonExternalId: "12345",
  primaryMetadata: "test",
  lastMeeting: "2026-01-01",
} as unknown as Person;

describe("ReconnectRow", () => {
  it("renders the recorded-on label when recordedOn is a Date", () => {
    render(
      <ReconnectRow
        person={mockPerson}
        recordedOn={new Date("2026-06-01T16:30:00.000Z")}
        uploadStatus="pending"
      />,
    );

    expect(screen.getByText(/Recorded on June 1 at/)).toBeOnTheScreen();
  });

  // Regression test for OBT-37472: devices that persisted the offline
  // upload queue before the storage reviver revived startTime/endTime end up
  // with a string here instead of a Date, which previously crashed with
  // "recordedOn.toLocaleDateString is not a function".
  it("does not throw and still renders a label when recordedOn is a string", () => {
    render(
      <ReconnectRow
        person={mockPerson}
        recordedOn={"2026-06-01T16:30:00.000Z" as unknown as Date}
        uploadStatus="pending"
      />,
    );

    expect(screen.getByText(/Recorded on June 1 at/)).toBeOnTheScreen();
  });

  it("renders nothing when person is undefined", () => {
    const { toJSON } = render(
      <ReconnectRow recordedOn={new Date()} uploadStatus="pending" />,
    );

    expect(toJSON()).toBeNull();
  });
});
