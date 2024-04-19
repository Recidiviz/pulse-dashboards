// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { unpackAggregatedErrors } from "../utils/unpackAggregatedErrors";
import { HydratesFromSource } from "./HydratesFromSource";

const mockExpectation = vi.fn();
const source = {
  populate: vi.fn(),
  expectPopulated: [mockExpectation],
};

const mockThrow = () => {
  throw new Error("oops");
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("source already populated", () => {
  const hfs = new HydratesFromSource(source);

  expect(hfs.hydrationState.status).toBe("hydrated");
});

test("source not populated", () => {
  mockExpectation.mockImplementation(mockThrow);

  const hfs = new HydratesFromSource(source);

  expect(hfs.hydrationState.status).toBe("needs hydration");
});

test("populate source", async () => {
  mockExpectation.mockImplementation(mockThrow);
  source.populate.mockImplementation(async () => {
    mockExpectation.mockReset();
  });

  const hfs = new HydratesFromSource(source);

  expect(hfs.hydrationState.status).toBe("needs hydration");

  const hydrationPromise = hfs.hydrate();

  expect(hfs.hydrationState.status).toBe("loading");

  await hydrationPromise;

  expect(hfs.hydrationState.status).toBe("hydrated");
});

test("error during population", async () => {
  const testError = new Error("test error");
  mockExpectation.mockImplementation(mockThrow);
  source.populate.mockImplementation(async () => {
    throw testError;
  });

  const hfs = new HydratesFromSource(source);

  await hfs.hydrate();

  expect(hfs.hydrationState).toEqual({ status: "failed", error: testError });
});

test("population fails to populate without throwing an error", async () => {
  mockExpectation.mockImplementation(mockThrow);
  const hfs = new HydratesFromSource(source);
  await hfs.hydrate();
  expect(hfs.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);
  expect(unpackAggregatedErrors(hfs)).toMatchInlineSnapshot(`
    [
      [Error: oops],
    ]
  `);
});

test("no redundant hydration while in progress", async () => {
  mockExpectation.mockImplementation(mockThrow);
  source.populate.mockImplementation(async () => {
    mockExpectation.mockReset();
  });

  const hfs = new HydratesFromSource(source);

  const h1 = hfs.hydrate();
  const h2 = hfs.hydrate();

  await Promise.all([h1, h2]);

  expect(source.populate).toHaveBeenCalledTimes(1);
});

test("don't hydrate if already hydrated", async () => {
  mockExpectation.mockImplementation(mockThrow);
  source.populate.mockImplementation(async () => {
    mockExpectation.mockReset();
  });

  const hfs = new HydratesFromSource(source);

  await hfs.hydrate();

  expect(hfs.hydrationState.status).toBe("hydrated");

  await hfs.hydrate();

  expect(source.populate).toHaveBeenCalledTimes(1);
});
