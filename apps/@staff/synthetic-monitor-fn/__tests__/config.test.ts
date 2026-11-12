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

import { loadConfig } from "../src/config";

const VALID_ENV = {
  STAFF_APP_URL: "https://dashboard-staging.recidiviz.org",
  STATE_CODE: "US_IA",
  STAFF_TEST_USER: "synthetic@example.com",
  STAFF_TEST_PASSWORD: "hunter2",
};

describe("loadConfig", () => {
  it("returns the parsed config when all env vars are present", () => {
    expect(loadConfig(VALID_ENV)).toEqual({
      url: "https://dashboard-staging.recidiviz.org",
      username: "synthetic@example.com",
      password: "hunter2",
      stateCode: "US_IA",
    });
  });

  it("throws listing every missing env var", () => {
    expect(() => loadConfig({})).toThrowError(
      "Missing required environment variable(s): STAFF_APP_URL, STATE_CODE, STAFF_TEST_USER, STAFF_TEST_PASSWORD",
    );
  });

  it("throws naming only the missing var when others are set", () => {
    const partial = {
      STAFF_APP_URL: VALID_ENV.STAFF_APP_URL,
      STATE_CODE: VALID_ENV.STATE_CODE,
      STAFF_TEST_USER: VALID_ENV.STAFF_TEST_USER,
    };
    expect(() => loadConfig(partial)).toThrowError(
      "Missing required environment variable(s): STAFF_TEST_PASSWORD",
    );
  });

  it.each(["../../etc/passwd", "US_IA/../x", "us_ia", "US_IAX", "IA"])(
    "rejects a STATE_CODE that isn't a state code: %s",
    (stateCode) => {
      expect(() => loadConfig({ ...VALID_ENV, STATE_CODE: stateCode })).toThrow(
        'STATE_CODE must look like "US_XX"',
      );
    },
  );
});
