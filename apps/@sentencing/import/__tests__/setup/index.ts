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

import { init } from "@sentry/node";
import sentryTestkit from "sentry-testkit";
import { beforeAll, beforeEach, vi } from "vitest";

import { getImportHandler } from "~@sentencing/import/handler";
import { seed } from "~@sentencing/import/test/setup/seed";
import { resetDb } from "~@sentencing/import/test/setup/utils";
import { getPrismaClientForStateCode } from "~@sentencing/prisma";
import { StateCode } from "~@sentencing/prisma/client";
import { MockImportHandler } from "~data-import-plugin/testkit";

export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

vi.mock("~data-import-plugin", () => ({
  ImportHandler: MockImportHandler,
}));

export let importHandler: ReturnType<typeof getImportHandler>;

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
    maxValueLength: 10000,
  });
});

beforeEach(async () => {
  await resetDb(testPrismaClient);
  await seed(testPrismaClient);

  testkit.reset();
});
