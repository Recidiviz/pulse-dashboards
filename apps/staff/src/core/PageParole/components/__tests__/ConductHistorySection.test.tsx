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

import { PaletteKey, statusStyles } from "../../../BadgePill/BadgePill";
import { ConductHistorySection } from "../ConductHistorySection";

const DEFAULT_CONDUCT_CLASSIFICATION_COLORS: Record<string, PaletteKey> = {
  Major: "SLATE_DARK",
  Minor: "SLATE_DARK",
};

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
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[record]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      />,
    );

    expect(screen.getByText("Fighting")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /see older disciplinaries/i }),
    ).not.toBeInTheDocument();
  });

  it("hides a record from over a year ago when no children are provided", () => {
    const record = makeRecord({ date: "2024-12-01", violation: "Fighting" });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[record]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      />,
    );

    expect(screen.queryByText("Fighting")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /see older disciplinaries/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a record from within the past year but hides an older one", () => {
    const recent = makeRecord({ date: "2025-12-31", violation: "Fighting" });
    const older = makeRecord({
      date: "2024-12-01",
      violation: "Unauthorized Area",
    });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[recent, older]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      />,
    );

    expect(screen.getByText("Fighting")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Area")).not.toBeInTheDocument();
  });

  // US_ID shows 3 years where US_CO shows 1 (OBT-46623), so the same record
  // must fall inside the window for one tenant and outside it for the other.
  it("widens the visible window when visibleYears is larger", () => {
    const twoYearsOld = makeRecord({
      date: "2024-03-01",
      violation: "Unauthorized Area",
    });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={3}
        conductHistory={[twoYearsOld]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      />,
    );

    expect(screen.getByText("Unauthorized Area")).toBeInTheDocument();
  });

  it("excludes a record older than visibleYears", () => {
    const fourYearsOld = makeRecord({
      date: "2022-01-05",
      violation: "Possession of Contraband",
    });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={3}
        conductHistory={[fourYearsOld]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      />,
    );

    expect(
      screen.queryByText("Possession of Contraband"),
    ).not.toBeInTheDocument();
  });

  it("renders children at the end of the section when conductHistory is populated", () => {
    const record = makeRecord({ date: "2025-12-31", violation: "Fighting" });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[record]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      >
        <div>Facility Notes</div>
      </ConductHistorySection>,
    );

    expect(screen.getByText("Facility Notes")).toBeInTheDocument();
  });

  it("renders children even when conductHistory is empty", () => {
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[]}
        conductClassificationColors={DEFAULT_CONDUCT_CLASSIFICATION_COLORS}
      >
        <div>Facility Notes</div>
      </ConductHistorySection>,
    );

    expect(screen.getByText("No Disciplinary Infractions")).toBeInTheDocument();
    expect(screen.getByText("Facility Notes")).toBeInTheDocument();
  });

  it("renders a colored badge using severity as its label when the tenant config has a matching color", () => {
    const record = makeRecord({
      date: "2025-12-31",
      violation: "Fighting",
      severity: "Class 1",
    });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[record]}
        conductClassificationColors={{ "Class 1": "BLUE" }}
      />,
    );

    expect(screen.getByText("Class 1")).toHaveStyleRule(
      "background-color",
      statusStyles.BLUE.backgroundColor,
    );
  });

  it("defaults to the SLATE_DARK color when the record's severity has no matching color entry", () => {
    const record = makeRecord({
      date: "2025-12-31",
      violation: "Fighting",
      severity: "Class 1",
    });
    render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={[record]}
        conductClassificationColors={{ "Class 2": "GREEN" }}
      />,
    );

    expect(screen.getByText("Class 1")).toHaveStyleRule(
      "background-color",
      statusStyles.SLATE_DARK.backgroundColor,
    );
  });

  it("summarizes violation counts by whichever severity labels appear in the case's history", () => {
    const records = [
      makeRecord({
        date: "2025-12-31",
        violation: "Refusal to Submit to Drug Test",
        severity: "Class 1",
      }),
      makeRecord({
        date: "2025-12-30",
        violation: "Fighting",
        severity: "Class 1",
      }),
      makeRecord({
        date: "2025-12-29",
        violation: "Unauthorized Area",
        severity: "Class 2",
      }),
    ];
    const { container } = render(
      <ConductHistorySection
        title="Institutional Conduct History"
        visibleYears={1}
        conductHistory={records}
        conductClassificationColors={{ "Class 1": "BLUE", "Class 2": "GREEN" }}
      />,
    );

    expect(container.textContent).toContain("Class 1: 2");
    expect(container.textContent).toContain("Class 2: 1");
  });
});
