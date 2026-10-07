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

import mockFirebaseAdmin from "firebase-admin";

import { stateCodes } from "~auth-utils";

import { fetchImpersonatedUserRestrictions } from "../../routes/api";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { getFirebaseToken } from "../firebaseToken";

vi.mock("firebase-admin");
vi.mock("../../utils/isOfflineMode");
vi.mock("../../routes/api", async (importOriginal) => ({
  ...(await importOriginal()),
  fetchImpersonatedUserRestrictions: vi.fn(),
}));

const createCustomTokenMock = vi.fn();

beforeEach(() => {
  const authMock = vi.fn(() => ({ createCustomToken: createCustomTokenMock }));
  mockFirebaseAdmin.auth = authMock;
  createCustomTokenMock.mockClear();
  fetchImpersonatedUserRestrictions.mockReset();
  fetchImpersonatedUserRestrictions.mockResolvedValue({ routes: {} });
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
    json: vi.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: [],
    forceWorkflowsDemoData: false,
    hasParoleBoardAccess: false,
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
    json: vi.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: ["US_XX"],
    forceWorkflowsDemoData: false,
    hasParoleBoardAccess: false,
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("Firebase token with forceWorkflowsDemoData: true", async () => {
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
        forceWorkflowsDemoData: true,
      },
    },
  };
  const mockRes = {
    json: vi.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: [],
    forceWorkflowsDemoData: true,
    hasParoleBoardAccess: false,
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
    json: vi.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: false,
    recidivizAllowedStates: Object.values(stateCodes),
    forceWorkflowsDemoData: false,
    hasParoleBoardAccess: false,
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
    json: vi.fn(),
  };

  await getFirebaseToken(mockReq, mockRes);

  expect(createCustomTokenMock).toHaveBeenCalledWith(userId, {
    app: "staff",
    stateCode: stateCode.toUpperCase(),
    impersonator: true,
    recidivizAllowedStates: [],
    forceWorkflowsDemoData: false,
    hasParoleBoardAccess: false,
  });
  expect(mockRes.json).toHaveBeenCalledWith({
    firebaseToken: mockFirebaseToken,
  });
});

test("grants hasParoleBoardAccess to a user with the parole route", async () => {
  const userId = "TEST123@somewhere.com";

  createCustomTokenMock.mockResolvedValue("tokenabc123");
  const mockReq = {
    user: {
      undefinedemail_address: userId,
      // this key includes an env variable that is not set in this test environment
      undefinedapp_metadata: { stateCode: "us_xx", routes: { parole: true } },
    },
  };

  await getFirebaseToken(mockReq, { json: vi.fn() });

  expect(createCustomTokenMock).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({ hasParoleBoardAccess: true }),
  );
});

test("grants an impersonated user hasParoleBoardAccess from their own permissions, not the impersonator's", async () => {
  const userId = "impersonatedEmail@somewhere.com";
  fetchImpersonatedUserRestrictions.mockResolvedValue({
    routes: { parole: true },
  });

  createCustomTokenMock.mockResolvedValue("tokenabc123");
  const mockReq = {
    user: {
      undefinedapp_metadata: { stateCode: "recidiviz", routes: {} },
    },
    query: {
      impersonationParams: JSON.stringify({
        impersonatedEmail: userId,
        impersonatedStateCode: "us_yy",
      }),
    },
  };

  await getFirebaseToken(mockReq, { json: vi.fn() });

  expect(fetchImpersonatedUserRestrictions).toHaveBeenCalledWith(userId);
  expect(createCustomTokenMock).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({ hasParoleBoardAccess: true }),
  );
});

test("withholds only hasParoleBoardAccess when the impersonated user's permissions cannot be fetched", async () => {
  const userId = "impersonatedEmail@somewhere.com";
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  fetchImpersonatedUserRestrictions.mockRejectedValue(
    new Error(`auth API unavailable for ${userId}`),
  );
  createCustomTokenMock.mockResolvedValue("tokenabc123");
  const mockReq = {
    user: {
      undefinedapp_metadata: { stateCode: "recidiviz" },
    },
    query: {
      impersonationParams: JSON.stringify({
        impersonatedEmail: userId,
        impersonatedStateCode: "us_yy",
      }),
    },
  };

  await getFirebaseToken(mockReq, { json: vi.fn() });

  expect(createCustomTokenMock).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({ hasParoleBoardAccess: false }),
  );
  expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(userId);
  consoleErrorSpy.mockRestore();
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

  const send = vi.fn();
  const mockRes = {
    status: vi.fn().mockImplementation(() => {
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
