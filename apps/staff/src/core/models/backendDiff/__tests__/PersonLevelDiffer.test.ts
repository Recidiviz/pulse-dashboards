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

import { PrisonPopulationPersonLevelRecord } from "../../types";
import { Diff, DiffValue } from "../Differ";
import { PersonLevelDiffer } from "../PersonLevelDiffer";

const differ: PersonLevelDiffer = new PersonLevelDiffer(10);

it("diffs equal data out of order", () => {
  const oldData: PrisonPopulationPersonLevelRecord[] = [
    {
      admissionReason: "Unknown",
      age: "25",
      ageGroup: "25-29",
      facility: "ABC",
      fullName: "FAKE, PERSON",
      gender: "MALE",
      lastUpdated: new Date(2021, 1, 1),
      stateId: "00001",
      timePeriod: "24",
      race: "WHITE",
    },
    {
      admissionReason: "Unknown",
      age: "32",
      ageGroup: "30-34",
      facility: "DEF",
      fullName: "EXAMPLE, USER",
      gender: "FEMALE",
      lastUpdated: new Date(2022, 6, 1),
      stateId: "00002",
      timePeriod: "6",
      race: "BLACK",
    },
  ];
  const newData: PrisonPopulationPersonLevelRecord[] = [
    {
      admissionReason: "Unknown",
      age: "32",
      ageGroup: "30-34",
      facility: "DEF",
      fullName: "EXAMPLE, USER",
      gender: "FEMALE",
      lastUpdated: new Date(2022, 6, 1),
      stateId: "00002",
      timePeriod: "6",
      race: "BLACK",
    },
    {
      admissionReason: "Unknown",
      age: "25",
      ageGroup: "25-29",
      facility: "ABC",
      fullName: "FAKE, PERSON",
      gender: "MALE",
      lastUpdated: new Date(2021, 1, 1),
      stateId: "00001",
      timePeriod: "24",
      race: "WHITE",
    },
  ];

  expect(differ.diff(oldData, newData).totalDiffs).toEqual(0);
  expect(differ.diff(oldData, newData).samples.entries).toHaveLength(0);
});

it("diffs unequal data", () => {
  const oldDifferentAge: PrisonPopulationPersonLevelRecord = {
    // Exists in new but with different age
    admissionReason: "Unknown",
    age: "25",
    ageGroup: "25-29",
    facility: "ABC",
    fullName: "FAKE, PERSON",
    gender: "MALE",
    lastUpdated: new Date(2021, 1, 1),
    stateId: "00001",
    timePeriod: "24",
    race: "WHITE",
  };
  const oldOnly: PrisonPopulationPersonLevelRecord = {
    admissionReason: "Unknown",
    age: "32",
    ageGroup: "30-34",
    facility: "DEF",
    fullName: "EXAMPLE, USER",
    gender: "FEMALE",
    lastUpdated: new Date(2022, 6, 1),
    stateId: "00002",
    timePeriod: "6",
    race: "BLACK",
  };
  const both: PrisonPopulationPersonLevelRecord = {
    admissionReason: "Unknown",
    age: "36",
    ageGroup: "35-39",
    facility: "DEF",
    fullName: "SAMPLE, INDIVIDUAL",
    gender: "MALE",
    lastUpdated: new Date(2022, 1, 1),
    stateId: "00003",
    timePeriod: "12",
    race: "ASIAN",
  };

  const newDifferentAge: PrisonPopulationPersonLevelRecord = {
    // Exists in new but with different age
    admissionReason: "Unknown",
    age: "27",
    ageGroup: "25-29",
    facility: "ABC",
    fullName: "FAKE, PERSON",
    gender: "MALE",
    lastUpdated: new Date(2021, 1, 1),
    stateId: "00001",
    timePeriod: "24",
    race: "WHITE",
  };
  const newOnly: PrisonPopulationPersonLevelRecord = {
    admissionReason: "Unknown",
    age: "40",
    ageGroup: "40-44",
    facility: "ABC",
    fullName: "NEW, USER",
    gender: "FEMALE",
    lastUpdated: new Date(2022, 1, 1),
    stateId: "00004",
    timePeriod: "12",
    race: "HISPANIC",
  };

  const oldData: PrisonPopulationPersonLevelRecord[] = [
    oldDifferentAge,
    oldOnly,
    both,
  ];

  const newData: PrisonPopulationPersonLevelRecord[] = [
    newOnly,
    both,
    newDifferentAge,
  ];

  const expectedDiffs: Map<
    string,
    DiffValue<PrisonPopulationPersonLevelRecord>
  > = new Map<string, DiffValue<PrisonPopulationPersonLevelRecord>>();

  expectedDiffs.set("00004|12|40-44", {
    oldValue: undefined,
    newValue: newOnly,
  });
  expectedDiffs.set("00001|24|25-29", {
    oldValue: oldDifferentAge,
    newValue: newDifferentAge,
  });
  expectedDiffs.set("00002|6|30-34", {
    oldValue: oldOnly,
    newValue: undefined,
  });
  const expectedDiffOutput: Diff<PrisonPopulationPersonLevelRecord> = {
    totalDiffs: 3,
    samples: expectedDiffs,
  };

  expect(differ.diff(oldData, newData)).toEqual(expectedDiffOutput);
});
