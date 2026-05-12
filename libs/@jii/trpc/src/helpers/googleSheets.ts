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

import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | undefined;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  // For local testing. When deployed, uses the Application Default Credentials.
  let credentials;
  if (process.env["SHEET_API_SERVICE_ACCOUNT"]) {
    credentials = {
      client_email: process.env["SHEET_API_SERVICE_ACCOUNT"],
      private_key: process.env["SHEET_API_SERVICE_ACCOUNT_PRIVATE_KEY"],
    };
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Fetches data from a Google Sheet and returns it as an array of row objects.
 * The first row is treated as headers; each subsequent row becomes a Record
 * keyed by header name.
 *
 * @param spreadsheetId - The ID of the Google Sheet (from the URL)
 * @param range - The A1 notation range to fetch (e.g., "Sheet1!A:Z")
 */
export async function getSheetData(
  spreadsheetId: string,
  range: string,
): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("Empty range: no header row found");
  }

  const [headers, ...dataRows] = rows;

  return dataRows.map((row) =>
    Object.fromEntries(
      headers.map((header: string, i: number) => [header, row[i] ?? ""]),
    ),
  );
}
