// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { DefaultOffenseTypeOrder } from "../types";
import { sortByLabel } from "../utils";

describe("sortByLabel", () => {
  it("sorts labels alphabetically ascending by default", () => {
    const data = [{ label: "Charlie" }, { label: "Alpha" }, { label: "Bravo" }];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("sorts labels alphabetically descending when desc is true", () => {
    const data = [{ label: "Alpha" }, { label: "Charlie" }, { label: "Bravo" }];
    const result = sortByLabel({
      dataPoints: data,
      labelKey: "label",
      desc: true,
    });
    expect(result.map((d) => d.label)).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it('keeps "All" first regardless of sort direction', () => {
    const data = [{ label: "Bravo" }, { label: "All" }, { label: "Alpha" }];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result[0].label).toBe("All");

    const resultDesc = sortByLabel({
      dataPoints: [{ label: "Bravo" }, { label: "All" }, { label: "Alpha" }],
      labelKey: "label",
      desc: true,
    });
    expect(resultDesc[0].label).toBe("All");
  });

  it('sorts "Unknown" to the end', () => {
    const data = [{ label: "Unknown" }, { label: "Bravo" }, { label: "Alpha" }];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual(["Alpha", "Bravo", "Unknown"]);
  });

  it('sorts "Not Coded" to the end', () => {
    const data = [
      { label: "Not Coded" },
      { label: "Bravo" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual(["Alpha", "Bravo", "Not Coded"]);
  });

  it('sorts both "Unknown" and "Not Coded" to the end', () => {
    const data = [
      { label: "Unknown" },
      { label: "Bravo" },
      { label: "Not Coded" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual([
      "Alpha",
      "Bravo",
      "Unknown",
      "Not Coded",
    ]);
  });

  it('sorts "Other" just before "Unknown" and "Not Coded"', () => {
    const data = [
      { label: "Unknown" },
      { label: "Other" },
      { label: "Bravo" },
      { label: "Not Coded" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual([
      "Alpha",
      "Bravo",
      "Other",
      "Unknown",
      "Not Coded",
    ]);
  });

  it('keeps "All" first and "Other"/"Unknown"/"Not Coded" last together', () => {
    const data = [
      { label: "Unknown" },
      { label: "All" },
      { label: "Bravo" },
      { label: "Other" },
      { label: "Not Coded" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual([
      "All",
      "Alpha",
      "Bravo",
      "Other",
      "Unknown",
      "Not Coded",
    ]);
  });

  it('puts "Other"/"Unknown"/"Not Coded" last even when sorting descending', () => {
    const data = [
      { label: "Unknown" },
      { label: "Bravo" },
      { label: "Other" },
      { label: "Not Coded" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({
      dataPoints: data,
      labelKey: "label",
      desc: true,
    });
    expect(result.map((d) => d.label)).toEqual([
      "Bravo",
      "Alpha",
      "Other",
      "Unknown",
      "Not Coded",
    ]);
  });

  it('puts "less than" labels right after "All"', () => {
    const data = [
      { label: "Bravo" },
      { label: "Less than 1 year" },
      { label: "All" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual([
      "All",
      "Less than 1 year",
      "Alpha",
      "Bravo",
    ]);
  });

  it('"less than" check is case-insensitive', () => {
    const data = [
      { label: "Bravo" },
      { label: "less Than 6 months" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({ dataPoints: data, labelKey: "label" });
    expect(result.map((d) => d.label)).toEqual([
      "less Than 6 months",
      "Alpha",
      "Bravo",
    ]);
  });

  it('puts "less than" before other labels but after "All", even when descending', () => {
    const data = [
      { label: "Unknown" },
      { label: "All" },
      { label: "Less than 1 year" },
      { label: "Bravo" },
      { label: "Alpha" },
    ];
    const result = sortByLabel({
      dataPoints: data,
      labelKey: "label",
      desc: true,
    });
    expect(result.map((d) => d.label)).toEqual([
      "All",
      "Less than 1 year",
      "Bravo",
      "Alpha",
      "Unknown",
    ]);
  });

  it("sorts by custom order when provided (e.g. offense type)", () => {
    const data = [
      { label: "Unknown", value: "UNKNOWN" },
      { label: "Drug Offenses", value: "DRUG OFFENSES" },
      { label: "Violent Felony", value: "VIOLENT FELONY" },
      {
        label: "Property and Other Offenses",
        value: "PROPERTY AND OTHER OFFENSES",
      },
      { label: "Other Coercive", value: "OTHER COERCIVE" },
      { label: "Youthful Offender", value: "YOUTHFUL OFFENDER" },
      { label: "Juvenile Offender", value: "JUVENILE OFFENDER" },
    ];
    const result = sortByLabel({
      dataPoints: data,
      labelKey: "label",
      valueKey: "value",
      sortOverride: DefaultOffenseTypeOrder,
    });
    expect(result.map((d) => d.value)).toEqual([
      "VIOLENT FELONY",
      "OTHER COERCIVE",
      "DRUG OFFENSES",
      "PROPERTY AND OTHER OFFENSES",
      "YOUTHFUL OFFENDER",
      "JUVENILE OFFENDER",
      "UNKNOWN",
    ]);
  });
});
