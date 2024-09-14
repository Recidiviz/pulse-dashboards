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

import { faker } from "@faker-js/faker";

import {
  FIXTURE_SEED_DEFAULT,
  hasDifferentValuesAtKeys,
} from "~fixture-generator";

import { clientInfoSchema } from "../schema";
import { rawClientInfoFactory } from "./factory";

// Freeze the date for all tests
const TEST_DATE = new Date("2023-01-01T00:00:00Z");

describe("function: ClientInfoRawFactory", () => {
  beforeAll(() => {
    faker.seed(FIXTURE_SEED_DEFAULT);
    vi.useFakeTimers({ now: TEST_DATE });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("should generate a valid client info", () => {
    const clientInfo = rawClientInfoFactory().build();
    expect(() => clientInfoSchema.parse(clientInfo)).not.toThrow();
  });

  it("should generate realistic client info entries", () => {
    const clientInfos = rawClientInfoFactory().buildList(3);
    expect(clientInfos.map((c) => clientInfoSchema.parse(c))).toMatchSnapshot();
  });

  it("should produce objects with variation at the values", () => {
    const clientInfos = rawClientInfoFactory().buildList(30);
    expect(
      hasDifferentValuesAtKeys(
        clientInfos.map((c) => clientInfoSchema.parse(c)),
      ),
    ).toBeTrue();
  });
});
