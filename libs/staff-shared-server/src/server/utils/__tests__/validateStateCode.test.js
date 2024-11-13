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

import { csgStateCodes } from "../../constants/stateCodes";
import { validateStateCode } from "../validateStateCode";

const { METADATA_NAMESPACE } = process.env;

// Set default number of assertions to 2
expect.defaultAssertions = 2;

const makeReq = (url, pathStateCode, userStateCode) => ({
  originalUrl: url,
  params: {
    stateCode: pathStateCode,
  },
  user: {
    [`${METADATA_NAMESPACE}app_metadata`]: {
      state_code: userStateCode,
    },
  },
});

const expectSuccess = (req) => {
  const next = vi.fn();
  const resp = { sendStatus: vi.fn() };

  validateStateCode()(req, resp, next);

  expect(next.mock.calls.length).toBe(1);
  expect(resp.sendStatus.mock.calls.length).toBe(0);
};

const expectStatus = (req, status) => {
  const next = vi.fn();
  const resp = {
    status: vi.fn().mockImplementation(() => {
      return { send: vi.fn() };
    }),
  };

  validateStateCode()(req, resp, next);

  expect(next.mock.calls.length).toBe(0);
  expect(resp.status.mock.calls.length).toBe(1);
  expect(resp.status.mock.calls[0][0]).toBe(status);
};

describe("validateStateCode", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should call next() if stateCode in request matches state code in app_metadata", () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "us_xx");
    expectSuccess(req);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should call next() if uppercase stateCode in request matches state code in app_metadata", () => {
    const req = makeReq("/api/us_xx/foo", "US_XX", "us_xx");
    expectSuccess(req);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should call next() if stateCode in request matches uppercase state code in app_metadata", () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "US_XX");
    expectSuccess(req);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should return 401 if stateCode in request does not match state code in app_metadata", () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "us_yy");
    expectStatus(req, 401);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should return 401 if user data not set in request", () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "");
    delete req.user;
    expectStatus(req, 401);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("should call next() if stateCode is recidiviz", () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "recidiviz");
    expectSuccess(req);
  });
});

describe("validateStateCode with csgStateCodes", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // eslint-disable-next-line vitest/expect-expect
  test.each(csgStateCodes)(
    `to ensure it calls next() if stateCode is csg and stateCode in request is a csgStateCode %s`,
    (reqStateCode) => {
      const req = makeReq("/api/us_xx/foo", reqStateCode, "csg");
      expectSuccess(req);
    },
  );

  // eslint-disable-next-line vitest/expect-expect
  it(`should return 401 if stateCode is csg and stateCode in request is not a csgStateCode: ${csgStateCodes}`, () => {
    const req = makeReq("/api/us_xx/foo", "us_xx", "csg");
    expectStatus(req, 401);
  });
});
