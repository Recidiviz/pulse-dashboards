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

import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import { ParoleCase, paroleCasesFixtureByState } from "~datatypes";

import { OffenseHistorySection } from "../OffenseHistorySection";

const FIXTURE_CASE = paroleCasesFixtureByState.US_CO["45821"];

const LONG_DESCRIPTION = Array.from(
  { length: 40 },
  (_, i) => `Sentence ${i} of the offense account.`,
).join(" ");

function caseWithLongDescription(): ParoleCase {
  const [firstOffense, ...otherOffenses] = FIXTURE_CASE.offenseHistory.offenses;
  return {
    ...FIXTURE_CASE,
    offenseHistory: {
      ...FIXTURE_CASE.offenseHistory,
      offenses: [
        { ...firstOffense, offenseNarrative: LONG_DESCRIPTION },
        ...otherOffenses,
      ],
    },
  };
}

describe("OffenseHistorySection", () => {
  it("heads each offense with its conviction and class felony", () => {
    render(<OffenseHistorySection caseDetail={FIXTURE_CASE} />);

    const [firstOffense] = FIXTURE_CASE.offenseHistory.offenses;
    expect(screen.getByText(firstOffense.conviction)).toBeInTheDocument();
    expect(screen.getAllByText(firstOffense.classFelony)).not.toHaveLength(0);
  });

  it("makes only each offense's description clickable", () => {
    render(<OffenseHistorySection caseDetail={FIXTURE_CASE} />);

    expect(screen.getAllByRole("button")).toHaveLength(
      FIXTURE_CASE.offenseHistory.offenses.length,
    );
  });

  it("shows the offense description inside a clickable card", () => {
    render(<OffenseHistorySection caseDetail={caseWithLongDescription()} />);

    const card = screen.getByRole("button", {
      name: new RegExp(LONG_DESCRIPTION.slice(0, 20)),
    });
    expect(within(card).getByText(LONG_DESCRIPTION)).toBeInTheDocument();
  });

  it("opens the full offense in a modal when a card is clicked", () => {
    render(<OffenseHistorySection caseDetail={caseWithLongDescription()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(LONG_DESCRIPTION.slice(0, 20)),
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Offense Details")).toBeInTheDocument();
    expect(within(dialog).getByText(LONG_DESCRIPTION)).toBeInTheDocument();
  });

  it("closes the offense modal", async () => {
    render(<OffenseHistorySection caseDetail={caseWithLongDescription()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(LONG_DESCRIPTION.slice(0, 20)),
      }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Close"));

    await waitForElementToBeRemoved(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
