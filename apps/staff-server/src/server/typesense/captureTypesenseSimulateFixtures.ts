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

/**
 * Regenerates the JSON fixtures in `./__fixtures__/` that back
 * `TYPESENSE_SIMULATE` in `typesenseManagement.js`, by invoking the real
 * route handlers against a real local Typesense instance and recording what
 * they actually send.
 *
 * Requires the local Typesense docker container (see
 * `libs/@typesense/tools/docker-compose.yaml`) running first:
 *
 *   nx offline typesense
 *   # or: docker compose -f libs/@typesense/tools/docker-compose.yaml up -d
 *
 * Run this script with:
 *
 *   nx capture-simulate-fixtures staff-server
 *
 * Tear the container down afterward if you don't need it for anything else:
 *
 *   nx offline-down typesense
 *
 * Re-run this whenever the Typesense image version in that docker-compose
 * file is bumped — diff the regenerated fixtures against what's checked in
 * to see whether Typesense's real error responses changed.
 */

import { mkdirSync, writeFileSync } from "fs";
import path from "path";

// typesenseManagement.js transitively imports the rest of ../routes/api.js,
// which reads GOOGLE_APPLICATION_CREDENTIALS_JSON unless offline mode is on.
// Must be set before that module graph loads, so this needs a dynamic import
// below rather than a static one (static imports are hoisted above this).
process.env["IS_OFFLINE"] = "true";

const REAL_TYPESENSE_HOST = "http://localhost:8108";
const REAL_API_KEY = "xyz"; // matches libs/@typesense/tools/docker-compose.yaml
const UNREACHABLE_HOST = "http://localhost:19999"; // nothing listens here

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

function buildReq(params?: { collectionName: string }) {
  const req: Record<string, unknown> = { params };
  const metadataKey = `${process.env["METADATA_NAMESPACE"] ?? ""}app_metadata`;
  req["user"] = { [metadataKey]: { state_code: "recidiviz" } };
  return req;
}

function buildRes() {
  const result: { status?: number; body?: unknown; threw?: string } = {};
  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    send(body: unknown) {
      result.body = body;
    },
    set() {
      return res;
    },
  };
  return { res, result };
}

async function capture(
  handler: (req: unknown, res: unknown) => Promise<void>,
  req: unknown,
) {
  const { res, result } = buildRes();
  try {
    await handler(req, res);
  } catch (error) {
    result.threw = (error as Error).message;
  }
  return result;
}

async function assertTypesenseReachable() {
  try {
    const response = await fetch(`${REAL_TYPESENSE_HOST}/health`);
    if (!response.ok)
      throw new Error(`responded with status ${response.status}`);
  } catch (error) {
    throw new Error(
      `Local Typesense isn't reachable at ${REAL_TYPESENSE_HOST} (${
        (error as Error).message
      }). Start it first: nx offline typesense (or ` +
        "docker compose -f libs/@typesense/tools/docker-compose.yaml up -d).",
    );
  }
}

function writeFixture(filename: string, result: unknown) {
  const fixturePath = path.join(FIXTURES_DIR, filename);
  writeFileSync(fixturePath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`wrote ${fixturePath}`);
}

async function main() {
  await assertTypesenseReachable();
  mkdirSync(FIXTURES_DIR, { recursive: true });

  const {
    typesenseCollectionSchema,
    typesenseCollectionsSummary,
    typesenseHealth,
  } = await import("./typesenseManagement");

  // unconfigured: createTypesenseInspectClient throws before any HTTP call
  delete process.env["TYPESENSE_HOST"];
  delete process.env["TYPESENSE_API_INSPECT_KEY"];
  writeFixture(
    "unconfigured-health.json",
    await capture(typesenseHealth, buildReq()),
  );

  // unauthorized: real host, wrong key
  process.env["TYPESENSE_HOST"] = REAL_TYPESENSE_HOST;
  process.env["TYPESENSE_API_INSPECT_KEY"] = "wrong-key";
  writeFixture(
    "unauthorized-collections.json",
    await capture(typesenseCollectionsSummary, buildReq()),
  );
  writeFixture(
    "unauthorized-schema.json",
    await capture(
      typesenseCollectionSchema,
      buildReq({ collectionName: "clients" }),
    ),
  );

  // not-found: real host/key, nonexistent collection
  process.env["TYPESENSE_API_INSPECT_KEY"] = REAL_API_KEY;
  writeFixture(
    "not-found-schema.json",
    await capture(
      typesenseCollectionSchema,
      buildReq({ collectionName: "does-not-exist" }),
    ),
  );

  // unreachable: closed port. Only fixturing typesenseHealth here --
  // typesenseCollectionsSummary/typesenseCollectionSchema hit responder()'s
  // known ECONNREFUSED-status bug (res.status("ECONNREFUSED") throws) on this
  // path, which a directly-invoked handler + mock res can't faithfully
  // capture (the mock doesn't replicate Express's real status validation),
  // and that bug is intentionally left unfixed for now.
  process.env["TYPESENSE_HOST"] = UNREACHABLE_HOST;
  writeFixture(
    "unreachable-health.json",
    await capture(typesenseHealth, buildReq()),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
