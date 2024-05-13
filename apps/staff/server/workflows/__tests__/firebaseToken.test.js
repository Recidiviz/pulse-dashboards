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

import { stateCodes } from "../../constants/stateCodes";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { getFirebaseToken } from "../firebaseToken";

jest.mock("firebase-admin");
jest.mock("../../utils/isOfflineMode");

const createCustomTokenMock = jest.fn();
const authMock = jest.fn(() => ({ createCustomToken: createCustomTokenMock }));
mockFirebaseAdmin.auth = authMock;

beforeEach(() => {
  jest.clearAllMocks();
});

test("requests Firebase auth token", async () => {
  const userId = "TEST123@somewhere.com";
  const stateCode = "us_xx";
  const mockFirebaseToken = "tokenabc123";

  createCustomTokenMock.mockResolvedValue(mockFirebaseToken);
  const mockReq = {
    user: {
      undefinedemail_address: userId,
      // this key includes an env variable that is not set in this test environment
      undefinedapp_metadata: { stateCode },
    },
  };
  const mockRes = {
    json: jest.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: [],
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("Firebase token with allowedStates", async () => {
  const userId = "TEST123@somewhere.com";
  const stateCode = "recidiviz";
  const mockFirebaseToken = "tokenabc123";

  createCustomTokenMock.mockResolvedValue(mockFirebaseToken);
  const mockReq = {
    user: {
      undefinedemail_address: userId,
      // this key includes an env variable that is not set in this test environment
      undefinedapp_metadata: {
        stateCode,
        allowedStates: ["us_xx"],
      },
    },
  };
  const mockRes = {
    json: jest.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: ["US_XX"],
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("Firebase token for offline mode allows all states", async () => {
  const userId = "notarealemail@recidiviz.org";
  const stateCode = "recidiviz";
  const mockFirebaseToken = "tokenabc123";

  isOfflineMode.mockReturnValueOnce(true);

  createCustomTokenMock.mockResolvedValue(mockFirebaseToken);
  const mockReq = {
    user: {
      undefinedemail_address: userId,
      // this key includes an env variable that is not set in this test environment
      undefinedapp_metadata: {
        stateCode,
      },
    },
  };
  const mockRes = {
    json: jest.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: Object.values(stateCodes),
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("requests Firebase auth token for impersonated user", async () => {
  const userId = "impersonatedEmail@somewhere.com";
  const stateCode = "us_yy";
  const mockFirebaseToken = "tokenabc123";

  createCustomTokenMock.mockResolvedValue(mockFirebaseToken);
  const mockReq = {
    user: {
      undefinedapp_metadata: { stateCode: "recidiviz" },
    },
    query: {
      impersonationParams: JSON.stringify({
        impersonatedEmail: userId,
        impersonatedStateCode: stateCode,
      }),
    },
  };
  const mockRes = {
    json: jest.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: true,
    recidivizAllowedStates: [],
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("responds with 403 forbidden when requested by a non-recidiviz user", async () => {
  const userId = "impersonatedEmail@somewhere.com";
  const stateCode = "us_yy";

  const mockReq = {
    user: {
      undefinedapp_metadata: { stateCode },
    },
    query: {
      impersonationParams: JSON.stringify({
        impersonatedEmail: userId,
        impersonatedStateCode: stateCode,
      }),
    },
  };

  const send = jest.fn();
  const mockRes = {
    status: jest.fn().mockImplementation(() => {
      return { send };
    }),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).not.toHaveBeenCalled();
  expect(send).toHaveBeenCalledWith({
    status: 403,
    errors: ["User does not have permission to access this resource"],
  });
});
