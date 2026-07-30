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

import { render, screen } from "@testing-library/react";

import { ParoleConductRecord } from "~datatypes";

import { ConductHistorySection } from "../ConductHistorySection";

function makeRecord(fields: Partial<ParoleConductRecord>): ParoleConductRecord {
  return {
    date: "2026-01-05",
    facility: "Western State Prison",
    violation: "Fighting",
    description: "Physical altercation in dining hall.",
    severity: "Major",
    disposition: "45 days disciplinary segregation",
    ...fields,
  };
}

describe("ConductHistorySection", () => {
  // Pin "now" to early January so a late-December record is only 5 days old
  // but falls in the previous calendar year.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 5));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats a record from a few days ago as recent even across a calendar-year boundary", () => {
    const record = makeRecord({ date: "2025-12-31", violation: "Fighting" });
    render(<ConductHistorySection conductHistory={[record]} />);

    expect(screen.getByText("Fighting")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /see older disciplinaries/i }),
    ).not.toBeInTheDocument();
  });

  it("still hides a record from over a year ago", () => {
    const record = makeRecord({ date: "2024-12-01", violation: "Fighting" });
    render(<ConductHistorySection conductHistory={[record]} />);

    expect(screen.queryByText("Fighting")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /see older disciplinaries/i }),
    ).toBeInTheDocument();
  });
});
