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

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

export async function getGoogleSheet(sheetId: string) {
  const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ];

  const clientEmail = process.env.SHEET_API_SERVICE_ACCOUNT || "";
  const privateKey = process.env.SHEET_API_SERVICE_ACCOUNT_KEY || "";

  const jwt = new JWT({
    email: clientEmail,
    key: privateKey.replace(/\\\\n/gm, "\n"),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(sheetId, jwt);

  await doc.loadInfo();

  return doc;
}
