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

import {
  getOptionalEnv,
  getOptionalPositiveIntEnv,
  getRequiredEnv,
  resolveRequiredEnv,
} from "../env";

const KEY = "IDAHO_TH_TEST_ENV_KEY";
const OTHER_KEY = "IDAHO_TH_TEST_ENV_OTHER";

afterEach(() => {
  delete process.env[KEY];
  delete process.env[OTHER_KEY];
});

describe("getRequiredEnv", () => {
  it("returns the configured value", () => {
    process.env[KEY] = "value";

    expect(getRequiredEnv(KEY)).toBe("value");
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
  ])("throws when the key is %s", (_label, value) => {
    if (value === undefined) delete process.env[KEY];
    else process.env[KEY] = value;

    // Fail fast at startup rather than call out with no credential.
    expect(() => getRequiredEnv(KEY)).toThrow(
      `Missing required env key: ${KEY}`,
    );
  });

  it("names the config group in the error", () => {
    expect(() => getRequiredEnv(KEY, { label: "GCS" })).toThrow(
      `Missing required GCS key: ${KEY}`,
    );
  });
});

describe("getOptionalEnv", () => {
  it("returns the configured value", () => {
    process.env[KEY] = "value";

    expect(getOptionalEnv(KEY)).toBe("value");
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
  ])("returns undefined when the key is %s", (_label, value) => {
    if (value === undefined) delete process.env[KEY];
    else process.env[KEY] = value;

    expect(getOptionalEnv(KEY)).toBeUndefined();
  });

  it("falls back to the supplied default for an empty or unset key", () => {
    expect(getOptionalEnv(KEY, { defaultValue: "fallback" })).toBe("fallback");

    process.env[KEY] = "";
    expect(getOptionalEnv(KEY, { defaultValue: "fallback" })).toBe("fallback");
  });

  it("prefers a real value over the default", () => {
    process.env[KEY] = "value";

    expect(getOptionalEnv(KEY, { defaultValue: "fallback" })).toBe("value");
  });
});

describe("getOptionalPositiveIntEnv", () => {
  it.each([
    ["a positive integer", "30", 30],
    ["a value with trailing text", "30ms", 30],
    ["unset", undefined, 60],
    ["empty", "", 60],
    ["zero", "0", 60],
    ["negative", "-5", 60],
    ["non-numeric", "soon", 60],
    ["a float below one", "0.5", 60],
  ])("reads %s as %i", (_label, value, expected) => {
    if (value === undefined) delete process.env[KEY];
    else process.env[KEY] = value;

    expect(getOptionalPositiveIntEnv(KEY, 60)).toBe(expected);
  });

  it("truncates a float toward zero", () => {
    process.env[KEY] = "12.9";

    expect(getOptionalPositiveIntEnv(KEY, 60)).toBe(12);
  });
});

describe("resolveRequiredEnv", () => {
  it("returns every requested key", () => {
    process.env[KEY] = "a";
    process.env[OTHER_KEY] = "b";

    expect(resolveRequiredEnv([KEY, OTHER_KEY] as const)).toEqual({
      [KEY]: "a",
      [OTHER_KEY]: "b",
    });
  });

  it("lists every missing key in one error", () => {
    // One message naming all of them beats a deploy that fails key by key.
    expect(() => resolveRequiredEnv([KEY, OTHER_KEY] as const)).toThrow(
      `env config missing env vars: ${KEY}, ${OTHER_KEY}`,
    );
  });

  it("treats an empty value as missing and names the config group", () => {
    process.env[KEY] = "a";
    process.env[OTHER_KEY] = "";

    expect(() =>
      resolveRequiredEnv([KEY, OTHER_KEY] as const, { label: "Google Places" }),
    ).toThrow(`Google Places config missing env vars: ${OTHER_KEY}`);
  });

  it("returns an empty object for no required keys", () => {
    expect(resolveRequiredEnv([] as const)).toEqual({});
  });
});
