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

export const US_AR_CONFIG: ProgramsConfig = {
  spreadsheetEnvVar: "US_AR_PROGRAMS_SPREADSHEET_ID",
  sheetRange: "Program list with descriptions for review!A:M",
  fixtures: [
    {
      dateAddedOrUpdated: new Date("2026-01-01"),
      programId: "AR.0001",
      category: "Education",
      title: "Adult Basic Education",
      description:
        "Provides foundational literacy and numeracy instruction for individuals below the 9th grade level.",
      facilitiesOffered: ["Cummins Unit", "Varner Unit"],
      numberOfDaysThatCanBeEarned: 30,
      prerequisites: "None",
      eligibilityRequirements: "All inmates",
    },
    {
      dateAddedOrUpdated: new Date("2026-01-01"),
      programId: "AR.0002",
      category: "Vocational",
      title: "Construction Technology",
      description:
        "Introduces students to basic construction techniques including framing, roofing, and finishing work.",
      facilitiesOffered: ["Tucker Unit", "East Arkansas Regional Unit"],
      numberOfDaysThatCanBeEarned: 45,
      prerequisites: "Must have GED/HSD",
      eligibilityRequirements: "All inmates",
    },
    {
      dateAddedOrUpdated: new Date("2026-01-01"),
      programId: "AR.0003",
      category: "Cognitive",
      title: "Thinking for a Change",
      description:
        "Cognitive-behavioral program that addresses antisocial thinking and behavior patterns.",
      facilitiesOffered: ["All facilities"],
      numberOfDaysThatCanBeEarned: 15,
      prerequisites: "None",
      eligibilityRequirements: "All inmates",
    },
  ],
};
