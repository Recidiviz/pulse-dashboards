// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import UserStore from "../RootStore/UserStore";

export async function fetchWorkflowsTemplates(
  stateCode: string,
  templateName: string,
  getTokenSilently: UserStore["getTokenSilently"],
): Promise<ArrayBuffer> {
  const token = await getTokenSilently();

  const url = `${process.env.REACT_APP_API_URL}/api/${stateCode}/workflows/templates?filename=${templateName}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Fetching Workflows Template from API failed.\nStatus: ${response.status} - ${response.statusText}`,
    );
  }
  return response.arrayBuffer();
}
