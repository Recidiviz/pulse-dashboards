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

import { describe, expect, test } from "vitest";

import { getMostSevereCharges } from "~@sentencing/trpc-types";

const charge = (
  offense: string,
  classificationType: string | null,
  classificationSubtype: string | null,
) => ({ offense, classificationType, classificationSubtype });

describe("getMostSevereCharges", () => {
  test("returns empty array for empty input", () => {
    expect(getMostSevereCharges([])).toEqual([]);
  });

  test("returns the single charge when there is only one", () => {
    const result = getMostSevereCharges([
      charge("Drug Possession", "FELONY", "B"),
    ]);
    expect(result).toEqual([
      { offenseName: "Drug Possession", offenseClass: "Felony B" },
    ]);
  });

  test("returns the unambiguous most severe charge", () => {
    const result = getMostSevereCharges([
      charge("Speeding", "INFRACTION", null),
      charge("Drug Trafficking", "FELONY", "A"),
      charge("Theft", "MISDEMEANOR", "B"),
    ]);
    expect(result).toEqual([
      { offenseName: "Drug Trafficking", offenseClass: "Felony A" },
    ]);
  });

  test("breaks ties by subtype — Felony A beats Felony B", () => {
    const result = getMostSevereCharges([
      charge("Lesser Felony", "FELONY", "B"),
      charge("Greater Felony", "FELONY", "A"),
    ]);
    expect(result).toEqual([
      { offenseName: "Greater Felony", offenseClass: "Felony A" },
    ]);
  });

  test("returns all tied charges when multiple share the top rank", () => {
    const result = getMostSevereCharges([
      charge("Drug Trafficking", "FELONY", "A"),
      charge("Assault", "FELONY", "A"),
      charge("Theft", "MISDEMEANOR", "B"),
    ]);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { offenseName: "Drug Trafficking", offenseClass: "Felony A" },
        { offenseName: "Assault", offenseClass: "Felony A" },
      ]),
    );
  });

  test("treats null classification as least severe", () => {
    const result = getMostSevereCharges([
      charge("Unknown", null, null),
      charge("Speeding", "INFRACTION", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Speeding", offenseClass: "Infraction" },
    ]);
  });

  test("returns all charges when all are unclassified (tied)", () => {
    const result = getMostSevereCharges([
      charge("Unknown A", null, null),
      charge("Unknown B", null, null),
    ]);
    expect(result).toHaveLength(2);
  });

  test("formats offenseClass without subtype when subtype is null", () => {
    const result = getMostSevereCharges([
      charge("Trespassing", "MISDEMEANOR", null),
    ]);
    expect(result).toEqual([
      { offenseName: "Trespassing", offenseClass: "Misdemeanor" },
    ]);
  });

  test("formats offenseClass as null when charge is unclassified", () => {
    const result = getMostSevereCharges([charge("Unknown", null, null)]);
    expect(result).toEqual([{ offenseName: "Unknown", offenseClass: null }]);
  });

  test("detects a new tie when a same-tier charge is added to an existing winner", () => {
    // Simulates: mostSevereOffenseName was "Murder" (sole Felony A),
    // then re-ingest adds "Robbery" (also Felony A) — should now be a tie,
    // not a no-op, so the FE can prompt the user to pick.
    const result = getMostSevereCharges([
      charge("Murder", "FELONY", "A"),
      charge("Robbery", "FELONY", "A"),
    ]);
    expect(result).toHaveLength(2);
  });

  test("no-op: same single winner returns the same offense name", () => {
    // The update loop skips writing when stored value === computed new value.
    // This test documents what getMostSevereCharges returns in the no-op case.
    const result = getMostSevereCharges([charge("Murder", "FELONY", "A")]);
    expect(result).toEqual([
      { offenseName: "Murder", offenseClass: "Felony A" },
    ]);
  });
});
