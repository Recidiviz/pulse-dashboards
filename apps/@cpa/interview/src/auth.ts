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

interface AuthParams {
  stateCode: string;
  docId: string;
}

interface AuthResponse {
  accessToken: string;
  clientPseudonymizedId: string;
  stateCode: string;
}

// TODO: https://github.com/Recidiviz/pulse-dashboards/issues/11609
// Use a real auth call here. We must reliably get the user's state code
// and pseudonymized client ID from the backend.
// See a rough example of what v0 did: apps/@reentry/backend/app/routes/intake_auth_router.py
//
// Originally name+DOB was tried, but the data was too erroneous to be reliable.
// Real endpoint:
// - POST /external/client/verify/state+docid - state_code, doc_id
export async function authenticate(params: AuthParams): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    accessToken: "dummy-token",
    clientPseudonymizedId: "dummy-pseudo-id",
    stateCode: params.stateCode,
  };
}
