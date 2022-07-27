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

import mockFirebaseAdmin from "firebase-admin";

import { getFirebaseToken } from "../firebaseToken";

jest.mock("firebase-admin");

const createCustomTokenMock = jest.fn();
const authMock = jest.fn(() => ({ createCustomToken: createCustomTokenMock }));
mockFirebaseAdmin.auth = authMock;

test("requests Firebase auth token", async () => {
  const userId = "TEST123";
  const stateCode = "us_xx";
  const mockFirebaseToken = "tokenabc123";

  createCustomTokenMock.mockResolvedValue(mockFirebaseToken);
  const mockReq = {
    user: {
      sub: userId,
      // this key includes an env variable that is not set in this test environment
      undefinedapp_metadata: { state_code: stateCode },
    },
  };
  const mockRes = {
    json: jest.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    stateCode: stateCode.toUpperCase(),
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});
