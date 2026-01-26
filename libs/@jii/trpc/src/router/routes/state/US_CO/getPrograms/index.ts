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

import { getSheetData } from "../../../../../helpers/googleSheets";
import { US_CO_PROGRAM_FIXTURES } from "./fixtures";

export type Program = {
  dateAddedOrUpdated?: Date;
  programId: string;
  category: string;
  title: string;
  description: string;
  facilitiesOffered: string[];
  numberOfDaysThatCanBeEarned: number;
  eligibilityRequirements: string;
  prerequisites: string;
};

const PROGRAM_FIELDS = [
  "Date added or updated",
  "Program ID",
  "Category",
  "Title",
  "Description",
  "Facilities offered",
  "Number of days that can be earned",
  "Eligibility requirements",
  "Prerequisites",
] as const;

type ProgramField = (typeof PROGRAM_FIELDS)[number];

const parseCommaSeparated = (value: string): string[] =>
  value ? value.split(",").map((s) => s.trim()) : [];

const parseProgram = (row: Record<ProgramField, string>): Program => ({
  dateAddedOrUpdated: row["Date added or updated"]
    ? new Date(row["Date added or updated"])
    : undefined,
  programId: row["Program ID"],
  category: row["Category"],
  title: row["Title"],
  description: row["Description"],
  facilitiesOffered: parseCommaSeparated(row["Facilities offered"]),
  numberOfDaysThatCanBeEarned: parseInt(
    row["Number of days that can be earned"],
    10,
  ),
  eligibilityRequirements: row["Eligibility requirements"],
  prerequisites: row["Prerequisites"],
});

export async function getPrograms(): Promise<Program[]> {
  if (process.env["IS_OFFLINE"]) return US_CO_PROGRAM_FIXTURES;

  const spreadsheetId = process.env["US_CO_PROGRAMS_SPREADSHEET_ID"];

  if (!spreadsheetId) {
    throw new Error("US_CO_PROGRAMS_SPREADSHEET_ID is not set");
  }

  const rows = await getSheetData(
    spreadsheetId,
    "Program list!A:I",
    PROGRAM_FIELDS,
  );
  return rows.map(parseProgram);
}
