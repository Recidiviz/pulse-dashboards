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
  formatDataWindowLabel,
  formatUploadDateLabel,
} from "../admissionsAndReleasesDataWindow";

const MOVEMENT_DATES = ["2024-02-17", "2025-08-21", "2024-11-03", "2025-04-09"];

describe("formatUploadDateLabel", () => {
  it("says when the data was last updated", () => {
    expect(formatUploadDateLabel(new Date(2026, 9, 1))).toBe(
      "Data last updated Oct 1, 2026",
    );
  });

  it("returns nothing before the metric has loaded", () => {
    expect(formatUploadDateLabel(undefined)).toBeUndefined();
  });
});

describe("formatDataWindowLabel", () => {
  it("spans every month when All is selected", () => {
    expect(formatDataWindowLabel(MOVEMENT_DATES, ["ALL"])).toBe(
      "Feb 2024 - Aug 2025",
    );
  });

  it("spans every month when no year is selected", () => {
    expect(formatDataWindowLabel(MOVEMENT_DATES, [])).toBe(
      "Feb 2024 - Aug 2025",
    );
  });

  it("keeps only the months of the selected years", () => {
    expect(formatDataWindowLabel(MOVEMENT_DATES, ["2024"])).toBe(
      "Feb 2024 - Nov 2024",
    );
  });

  it("shows a single month once when the window is one month", () => {
    expect(formatDataWindowLabel(["2024-02-03", "2024-02-17"], ["ALL"])).toBe(
      "Feb 2024",
    );
  });

  it("returns undefined when no movement date is in the selected years", () => {
    expect(formatDataWindowLabel(MOVEMENT_DATES, ["2023"])).toBeUndefined();
  });

  it("returns undefined when there are no movement dates", () => {
    expect(formatDataWindowLabel([], ["ALL"])).toBeUndefined();
  });
});
