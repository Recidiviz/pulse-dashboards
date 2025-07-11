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

import { isDemoMode } from "~client-env-utils";

import {
  collectionNameForCurrentEnv,
  collectionNameFromConfig,
} from "./collectionNames";

vi.mock("~client-env-utils");

describe("collectionNameForCurrentEnv", () => {
  describe("live mode", () => {
    beforeEach(() => {
      vi.mocked(isDemoMode).mockReturnValue(false);
    });

    test("collection key", () => {
      expect(collectionNameForCurrentEnv({ key: "residents" })).toBe(
        "residents",
      );
    });

    test("raw name", () => {
      expect(collectionNameForCurrentEnv({ raw: "foo" })).toBe("foo");
    });
  });

  describe("demo mode", () => {
    beforeEach(() => {
      vi.mocked(isDemoMode).mockReturnValue(true);
    });

    test("collection key", () => {
      expect(collectionNameForCurrentEnv({ key: "residents" })).toBe(
        "DEMO_residents",
      );
    });

    test("raw name", () => {
      expect(collectionNameForCurrentEnv({ raw: "foo" })).toBe("DEMO_foo");
    });
  });
});

describe("collectionNameFromConfig", () => {
  describe("live collections", () => {
    test("collection key", () => {
      expect(
        collectionNameFromConfig({ name: { key: "residents" }, demo: false }),
      ).toBe("residents");
    });

    test("raw name", () => {
      expect(
        collectionNameFromConfig({ name: { raw: "foo" }, demo: false }),
      ).toBe("foo");
    });
  });
  describe("demo collections", () => {
    test("collection key", () => {
      expect(
        collectionNameFromConfig({ name: { key: "residents" }, demo: true }),
      ).toBe("DEMO_residents");
    });

    test("raw name", () => {
      expect(
        collectionNameFromConfig({ name: { raw: "foo" }, demo: true }),
      ).toBe("DEMO_foo");
    });
  });
});
