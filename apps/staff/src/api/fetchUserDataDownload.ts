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

import { downloadZipFile } from "../core/Paperwork/utils";
import UserStore from "../RootStore/UserStore";
import {fetchHelper} from "./utils";


export async function downloadTexasUserData(
  stateCode: string,
  getTokenSilently: UserStore["getTokenSilently"],
) {
  const fileName = "us_tx_eligible_clients_for_user_download.csv";
  const url = `${import.meta.env.VITE_API_URL}/api/US_${stateCode}/workflows/dataDownload?filename=${fileName}`;

  const dataDownload = await fetchHelper(
    getTokenSilently,
    url,
    "Fetching Workflows Data Download from API failed.\nStatus:",
  );

  downloadZipFile("TDCJ Parole ARS ERS Eligible Clients.zip", [
    {
      filename: "TDCJ Parole ARS ERS Eligible Clients.csv",
      fileContents: dataDownload,
    },
  ]);
}
