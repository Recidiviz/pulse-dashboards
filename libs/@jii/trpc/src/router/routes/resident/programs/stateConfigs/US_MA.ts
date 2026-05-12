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

import { ProgramsConfig } from "../types";

export const US_MA_CONFIG: ProgramsConfig = {
  spreadsheetEnvVar: "US_MA_PROGRAMS_SPREADSHEET_ID",
  sheetRange: "Program list!A:I",
  fixtures: [
    {
      dateAddedOrUpdated: new Date("2026-01-16"),
      programId: "MA.0001",
      category: "Education",
      title: "Introduction to Plumbing",
      description:
        "Introduces students to the basics of plumbing including pipe fitting, soldering, and installation of fixtures.",
      facilitiesOffered: ["MCI-Concord", "MCI-Shirley"],
      numberOfDaysThatCanBeEarned: 24,
      eligibilityRequirements: "Must have GED/HSD",
      prerequisites: "Foundation of Career Tech Ed",
    },
    {
      dateAddedOrUpdated: new Date("2026-01-16"),
      programId: "MA.0002",
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
      programId: "MA.0003",
      category: "Vocational",
      title: "Culinary Arts",
      description:
        "Provides hands-on training in food preparation, kitchen safety, and ServSafe certification to prepare participants for employment in the food service industry.",
      facilitiesOffered: ["MCI-Norfolk", "Old Colony Correctional Center"],
      numberOfDaysThatCanBeEarned: 18,
      eligibilityRequirements: "Must have GED/HSD",
      prerequisites: "None",
    },
    {
      dateAddedOrUpdated: new Date("2026-01-16"),
      programId: "MA.0004",
      category: "Cognitive & Behavioral",
      title: "Thinking for a Change",
      description:
        "An integrated, cognitive-behavioral program that includes cognitive restructuring, social skills, and problem-solving to reduce recidivism.",
      facilitiesOffered: [
        "Souza-Baranowski Correctional Center",
        "MCI-Cedar Junction",
        "MCI-Framingham",
      ],
      numberOfDaysThatCanBeEarned: 10,
      eligibilityRequirements: "None",
      prerequisites: "None",
    },
  ],
};
