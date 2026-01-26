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

import type { Program } from ".";

export const US_CO_PROGRAM_FIXTURES: Program[] = [
  {
    dateAddedOrUpdated: new Date("2026-01-16"),
    programId: "99.0001",
    category: "Education",
    title: "Introduction to Plumbing",
    description:
      "Introduces students to the basics of plumbing including pipe fitting, soldering, and installation of fixtures.",
    facilitiesOffered: [
      "Sterling Correctional Facility",
      "Limon Correctional Facility",
    ],
    numberOfDaysThatCanBeEarned: 24,
    eligibilityRequirements: "Must have GED/HSD",
    prerequisites: "Foundation of Career Tech Ed",
  },
  {
    dateAddedOrUpdated: new Date("2026-01-16"),
    programId: "99.0002",
    category: "Education",
    title: "Basic Literacy",
    description:
      "Literacy instruction is provided for learners who are assessed below the 9th grade education level.",
    facilitiesOffered: ["All facilities"],
    numberOfDaysThatCanBeEarned: 30,
    eligibilityRequirements: "None",
    prerequisites: "None",
  },
  {
    dateAddedOrUpdated: new Date("2026-01-16"),
    programId: "99.0003",
    category: "Education",
    title: "Small Engine Repair",
    description:
      "Introduces students to the repair and maintenance of small engines including lawn mowers, generators, and similar equipment.",
    facilitiesOffered: [
      "Fremont Correctional Facility",
      "Buena Vista Correctional Complex",
    ],
    numberOfDaysThatCanBeEarned: 18,
    eligibilityRequirements: "Must have GED/HSD",
    prerequisites: "None",
  },
  {
    dateAddedOrUpdated: new Date("2026-01-16"),
    programId: "99.0004",
    category: "Education",
    title: "Conflict Resolution",
    description: "",
    facilitiesOffered: [
      "Colorado Territorial Correctional Facility",
      "Denver Women's Correctional Facility",
      "La Vista Correctional Facility",
    ],
    numberOfDaysThatCanBeEarned: 10,
    eligibilityRequirements: "None",
    prerequisites: "None",
  },
];
