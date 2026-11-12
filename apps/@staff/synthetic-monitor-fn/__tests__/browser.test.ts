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
  isHeaded,
  isServerlessRuntime,
  resolveLaunchOptions,
} from "../src/browser";

describe("isServerlessRuntime", () => {
  it("is true when K_SERVICE is set (Cloud Run / Functions gen2)", () => {
    expect(
      isServerlessRuntime({ K_SERVICE: "staff-synthetic-monitor-us-ia" }),
    ).toBe(true);
  });

  it("is false locally", () => {
    expect(isServerlessRuntime({})).toBe(false);
  });
});

describe("resolveLaunchOptions", () => {
  it("honors CHROMIUM_EXECUTABLE_PATH as an explicit override", async () => {
    expect(
      await resolveLaunchOptions({
        CHROMIUM_EXECUTABLE_PATH: "/usr/bin/chromium",
      }),
    ).toEqual({ executablePath: "/usr/bin/chromium", headless: true });
  });

  it("uses the system Chrome channel locally", async () => {
    expect(await resolveLaunchOptions({})).toEqual({
      channel: "chrome",
      headless: true,
    });
  });

  it("runs headed locally with HEADED=true and respects SLOWMO", async () => {
    expect(
      await resolveLaunchOptions({ HEADED: "true", SLOWMO: "250" }),
    ).toEqual({ channel: "chrome", headless: false, slowMo: 250 });
  });

  it("stays headless in the serverless runtime even when HEADED is set", async () => {
    const opts = await resolveLaunchOptions({ K_SERVICE: "x", HEADED: "true" });
    expect(opts.headless).toBe(true);
    expect(opts.channel).toBeUndefined();
    expect(opts.executablePath).toEqual(expect.any(String));
    expect(opts.args).toEqual(expect.any(Array));
    // --disable-web-security makes the headless browser omit the Origin header,
    // which 500s the staff backend's CORS check — must be stripped.
    expect(opts.args).not.toContain("--disable-web-security");
  });
});

describe("isHeaded", () => {
  it("is true for HEADED=true / 1", () => {
    expect(isHeaded({ HEADED: "true" })).toBe(true);
    expect(isHeaded({ HEADED: "1" })).toBe(true);
  });

  it("is false otherwise", () => {
    expect(isHeaded({})).toBe(false);
    expect(isHeaded({ HEADED: "false" })).toBe(false);
  });
});
