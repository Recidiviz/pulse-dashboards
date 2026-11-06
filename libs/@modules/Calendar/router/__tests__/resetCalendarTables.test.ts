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

import { resetCalendarTables } from "./setup/resetCalendarTables";

test("resetCalendarTables refuses to run outside Vitest", async () => {
  vi.stubEnv("VITEST", "");
  const executeRawUnsafe = vi.fn();

  await expect(
    resetCalendarTables({
      $executeRawUnsafe: executeRawUnsafe,
      $queryRawUnsafe: vi.fn(),
    }),
  ).rejects.toThrow("only runs under Vitest");
  expect(executeRawUnsafe).not.toHaveBeenCalled();
});

test("resetCalendarTables refuses a database whose name doesn't end in -test", async () => {
  const executeRawUnsafe = vi.fn();
  const queryRawUnsafe = vi
    .fn()
    .mockResolvedValue([{ name: "module-Calendar" }]);

  await expect(
    resetCalendarTables({
      $executeRawUnsafe: executeRawUnsafe,
      $queryRawUnsafe: queryRawUnsafe,
    }),
  ).rejects.toThrow("only runs on a test database, not module-Calendar");
  expect(executeRawUnsafe).not.toHaveBeenCalled();
});
