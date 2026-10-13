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

import { render, screen, within } from "@testing-library/react";

import { ParoleHearingHistoryEntry } from "~datatypes";

import { UsIdHearingHistorySection } from "../UsIdHearingHistorySection";

function hearing(
  fields: Partial<ParoleHearingHistoryEntry>,
): ParoleHearingHistoryEntry {
  return {
    hearingDate: "2018-01-15",
    hearingType: "Regular Hearing",
    hearingDecision: "Parole granted",
    ...fields,
  };
}

describe("UsIdHearingHistorySection", () => {
  it("renders each hearing's month, type and decision in the order given", () => {
    render(
      <UsIdHearingHistorySection
        hearingHistory={[
          hearing({
            hearingDate: "2019-11-20",
            hearingType: "Revocation Hearing",
            hearingDecision: "Parole revoked",
          }),
          hearing({}),
        ]}
      />,
    );

    expect(screen.getByText("Hearing History")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "11/2019Revocation HearingParole revoked",
      "1/2018Regular HearingParole granted",
    ]);
  });

  it("omits the decision line when a hearing has no decision", () => {
    render(
      <UsIdHearingHistorySection
        hearingHistory={[hearing({ hearingDecision: undefined })]}
      />,
    );

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Regular Hearing")).toBeInTheDocument();
    expect(item.textContent).toBe("1/2018Regular Hearing");
  });

  it("renders two hearings that differ only by subtype without a duplicate key warning", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <UsIdHearingHistorySection
        hearingHistory={[
          hearing({ hearingSubtype: "Initial" }),
          hearing({ hearingSubtype: "Reconsideration" }),
        ]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("shows an empty state when there are no hearings", () => {
    render(<UsIdHearingHistorySection hearingHistory={[]} />);

    expect(screen.getByText("Hearing History")).toBeInTheDocument();
    expect(
      screen.getByText("No hearing history on record"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
