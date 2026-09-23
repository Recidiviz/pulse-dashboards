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

import { StateCode } from "~@jii/configs";
import {
  getPrismaClient,
  isRealDatabaseEnvironment,
  PrismaClient,
} from "~@jii/prisma";
import { LoaderContext } from "~data-import-plugin";
import { withDateshift } from "~datatypes";

import { facilityHandler } from "../handlers/facility/facility";
import { residentHandler } from "../handlers/resident/resident";
import { transformAndLoadRNAWritebackData } from "../handlers/usNcRNA/usNcRNA";
import {
  facilityImportSchema,
  residentImportSchema,
  rnaWritebackImportSchema,
} from "../models";
import { getEnabledStateCodes } from "../utils/getEnabledStateCodes";
import { facilityFixtures } from "./fixtures/incarcerationFacility";
import { residentFixtures } from "./fixtures/resident";
import { usNcRNAWritebackFixtures } from "./fixtures/usNcRNA";

async function* toAsyncGenerator<T>(items: T[]) {
  for (const item of items) {
    yield item;
  }
}

// this should be false locally (there are no demo DBs in the dev environment) and true in GCP
const demo = process.env["SEED_DEMO"] === "true";

// Fixture dates are normally shifted to stay relevant to the current date. The e2e suite is the
// exception, as the tests rely on data being stable over time. This flag defaults to true,
// so only the e2e config has to opt out.
const shouldShiftFixtureDates = process.env["SHIFT_FIXTURE_DATES"] !== "false";

// this guards against accidentally destroying real data in staging or prod, since the same environment
// serves both real and demo data there. This relies on logic shared with Prisma to decide which DB to connect to,
// to ensure both determinations stay in sync.
if (isRealDatabaseEnvironment() && !demo) {
  throw new Error(
    "Refusing to seed the non-demo state databases in a real database environment. " +
      "SEED_DEMO must be set to 'true' when running against a deployed or staging database.",
  );
}

type SeedOpts<ModelRecord> = {
  stateCode: StateCode;
  prismaClient: PrismaClient;
  fixtureMap: Map<StateCode, Array<unknown>>;
  // The LoaderFn type is normally used for handlers, but it takes the schema as an argument
  // rather than its output. That breaks the generic type mapping for this function, which
  // only works cleanly if the record shape itself is provided. Thus we redefine a compatible type here
  importHandler: (
    prismaClient: PrismaClient,
    data: AsyncGenerator<ModelRecord>,
    context: LoaderContext,
  ) => Promise<void>;
  // Similarly, this is a duck type for the more idiomatic z.ZodType, which takes multiple
  // arguments that overcomplicate our generic type mapping and cause spurious failures.
  // They don't affect the .parse() signature, which is the only thing we care about here
  importSchema: { parse(data: unknown): ModelRecord };
  modelLabel: string;
  logSkippedStates?: boolean;
};

let success = true;

/**
 * This function parallels our ImportHandler subclass, using the same model-specific import schemas and handler functions
 * but operating on local fixture objects rather than platform exports. These may have a different shape
 * than the raw data (some are shared with Workflows) in addition to coming from a different source.
 * The environment variable SEED_DEMO may be used for seeding the demo DBs in staging/prod; by default it hits the main
 * state DBS which are assumed to be in a local environment.
 */
async function seedModel<ModelRecord>({
  stateCode,
  prismaClient,
  fixtureMap,
  modelLabel,
  importHandler,
  logSkippedStates = true,
  importSchema,
}: SeedOpts<ModelRecord>) {
  const fixtures = fixtureMap.get(stateCode);
  if (fixtures && fixtures.length > 0) {
    try {
      // NOTE that these fixtures must be parsed eagerly, as they are here: withDateshift turns the
      // flag off again as soon as it returns, so a generator that parsed lazily would do its parsing
      // after the flag was already restored, silently storing unshifted dates with no error.
      // The type signature does not catch this, since a lazy map still returns an array.
      const parseFixtures = () => fixtures.map((f) => importSchema.parse(f));

      // scoping the dateshift flag to this call guards against it leaking to other parts of the app
      const parsedFixtures = shouldShiftFixtureDates
        ? withDateshift(parseFixtures)
        : parseFixtures();
      await importHandler(
        prismaClient,
        toAsyncGenerator(parsedFixtures),
        // initialize a new loader context for this model, same as the import does.
        // this is basically a dummy object in this context, the error data it collects
        // is not applicable to the seeding process and it will never be updated.
        { skippedRowIds: new Set<string>(), unidentifiedSkippedRowCount: 0 },
      );
      console.log(`Successfully seeded ${modelLabel} for ${stateCode}`);
    } catch (e) {
      console.error(`Seeding ${modelLabel} failed for ${stateCode}`);
      console.error(e);
      success = false;
    }
  } else {
    if (logSkippedStates)
      console.log(
        `Skipping ${modelLabel} for ${stateCode}; no fixtures available`,
      );
  }
}

const stateCodesToSeed = getEnabledStateCodes();

await Promise.all(
  stateCodesToSeed.map(async (stateCode) => {
    const prismaClient = getPrismaClient({ stateCode, demo });
    const baseOpts = { prismaClient, stateCode };
    await Promise.all([
      seedModel({
        modelLabel: "residents",
        fixtureMap: residentFixtures,
        importHandler: residentHandler,
        importSchema: residentImportSchema,
        ...baseOpts,
      }),
      seedModel({
        modelLabel: "incarceration facilities",
        fixtureMap: facilityFixtures,
        importHandler: facilityHandler,
        importSchema: facilityImportSchema,
        ...baseOpts,
      }),
      seedModel({
        modelLabel: "RNA writeback",
        fixtureMap: usNcRNAWritebackFixtures,
        importHandler: transformAndLoadRNAWritebackData,
        importSchema: rnaWritebackImportSchema,
        logSkippedStates: false,
        ...baseOpts,
      }),
    ]);
  }),
);

console.log("Seeding complete");

// ensure the script doesn't hang once all the work is done
process.exit(success ? 0 : 1);
