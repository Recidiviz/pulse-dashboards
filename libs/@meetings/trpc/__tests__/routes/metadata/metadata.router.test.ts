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

import { requiresUpgrade } from "~@meetings/trpc/routes/metadata/metadata.router";
import { testTRPCClient } from "~@meetings/trpc/test/setup";

describe("metadata router", () => {
  describe("checkAppVersion", () => {
    test("requires an upgrade for a release older than the minimum", async () => {
      const result = await testTRPCClient.v1.metadata.checkAppVersion.query({
        appVersion: "0.10.8",
      });
      expect(result).toEqual({ requiresUpgrade: true });
    });

    test("does not require an upgrade for the minimum release", async () => {
      const result = await testTRPCClient.v1.metadata.checkAppVersion.query({
        appVersion: "0.10.12",
      });
      expect(result).toEqual({ requiresUpgrade: false });
    });
  });

  describe("requiresUpgrade", () => {
    test.each([
      ["0.10.11", true],
      ["0.9.0", true],
      ["0.5.0", true],
      ["0.10.12", false],
      ["0.11.0", false],
      ["0.14.0", false],
      ["1.0.0", false],
    ])("compares %s numerically, not as a string", (appVersion, expected) => {
      expect(requiresUpgrade(appVersion)).toBe(expected);
    });

    test.each(["0.0.0", "any value", "0.10", ""])(
      "never requires an upgrade for an unreleased or unparseable version (%s)",
      (appVersion) => {
        expect(requiresUpgrade(appVersion)).toBe(false);
      },
    );
  });
});
