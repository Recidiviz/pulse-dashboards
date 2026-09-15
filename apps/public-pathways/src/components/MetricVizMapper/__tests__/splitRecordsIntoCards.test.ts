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

import { SnapshotDataRecord } from "~shared-pathways";

import { splitRecordsIntoCards } from "../VizSnapshotCards";

const record = (
  custodyStatus: string,
  releaseType: string,
  count: number,
): SnapshotDataRecord =>
  ({ custodyStatus, releaseType, count }) as unknown as SnapshotDataRecord;

const individuals = "Incarcerated Individual";
const parolees = "Incarcerated Parolee";

describe("splitRecordsIntoCards", () => {
  it("returns no cards for no records", () => {
    expect(splitRecordsIntoCards([], "custodyStatus")).toEqual([]);
  });

  it("gives each value of the dimension its own card", () => {
    const cards = splitRecordsIntoCards(
      [
        record(individuals, "Parole", 100),
        record(parolees, "Other", 20),
        record(individuals, "Conditional Release", 80),
      ],
      "custodyStatus",
    );

    expect(cards.map((card) => card.value)).toEqual([individuals, parolees]);
    expect(cards[0].records).toHaveLength(2);
    expect(cards[1].records).toHaveLength(1);
  });

  it("orders cards by where each value first appears", () => {
    const cards = splitRecordsIntoCards(
      [record(parolees, "Other", 20), record(individuals, "Parole", 100)],
      "custodyStatus",
    );

    expect(cards.map((card) => card.value)).toEqual([parolees, individuals]);
  });

  it("keeps every record with its own card's value", () => {
    const cards = splitRecordsIntoCards(
      [
        record(individuals, "Parole", 100),
        record(individuals, "Maximum Expiration", 30),
      ],
      "custodyStatus",
    );

    expect(cards).toHaveLength(1);
    expect(cards[0].records.map((r) => r.count)).toEqual([100, 30]);
  });

  it("leaves out a record that has no value for the dimension", () => {
    const cards = splitRecordsIntoCards(
      [
        record(individuals, "Parole", 100),
        { count: 5 } as unknown as SnapshotDataRecord,
      ],
      "custodyStatus",
    );

    expect(cards).toHaveLength(1);
    expect(cards[0].records).toHaveLength(1);
  });

  it("returns no cards when the dimension is absent throughout", () => {
    expect(
      splitRecordsIntoCards(
        [record(individuals, "Parole", 100)],
        "notADimension",
      ),
    ).toEqual([]);
  });
});
