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

import { request } from "node:http";

import { File } from "@google-cloud/storage";
import { GenericContainer } from "testcontainers";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

const FAKE_GCS_PORT = 4443;

const gcsContainer = await new GenericContainer("fsouza/fake-gcs-server:1.52.3")
  .withEntrypoint([
    "/bin/fake-gcs-server",
    "-scheme",
    "http",
    "-public-host",
    "localhost:4443",
  ])
  .withExposedPorts(FAKE_GCS_PORT)
  .start();

export const GCS_API_ENDPOINT = `http://${gcsContainer.getHost()}:${gcsContainer.getMappedPort(FAKE_GCS_PORT)}`;

const data = JSON.stringify({ externalUrl: GCS_API_ENDPOINT });

// This updates the external url of the fake-gcs-server so that uploads work
const options = {
  hostname: new URL(GCS_API_ENDPOINT).hostname,
  port: new URL(GCS_API_ENDPOINT).port,
  path: `${new URL(GCS_API_ENDPOINT).pathname}/_internal/config`,
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = request(options);
req.write(data);
req.end();

// Mock out the Storage constructor to use our fake-gcs-server endpoint
vi.mock("@google-cloud/storage", async (importOriginal) => {
  const mod: typeof import("@google-cloud/storage") = await importOriginal();
  return {
    ...mod,
    Storage: vi.fn(
      () =>
        new mod.Storage({ apiEndpoint: GCS_API_ENDPOINT, projectId: "test" }),
    ),
  };
});

// Mock the getSignedUrl method to return a predictable URL
vi.spyOn(File.prototype, "getSignedUrl").mockImplementation(async function (
  this: File,
) {
  return [`${GCS_API_ENDPOINT}/${this.bucket.name}/${this.name}`];
});
