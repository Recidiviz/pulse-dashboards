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

import { Storage } from "@google-cloud/storage";

import { permissionSchema } from "~@jii/auth";

import { getRecidivizUserProfile } from "./recidivizUsers";

vi.mock("@google-cloud/storage");

const mockStorageBucket = vi.fn();
const mockStorageFile = vi.fn();

beforeEach(() => {
  // this gets used to look up an ACL for recidiviz accounts
  const mockStorageClient = {
    bucket: mockStorageBucket,
  };
  mockStorageBucket.mockReturnValue({
    file: mockStorageFile,
  });
  mockStorageFile.mockReturnValue({
    download: async () => [
      Buffer.from(JSON.stringify({ allowedStates: ["US_OZ"] })),
    ],
  });
  // @ts-expect-error not passing a complete object here, only what we need to stub
  vi.mocked(Storage).mockReturnValue(mockStorageClient);
});

const testEmail = "test@recidiviz.org";

describe("Recidiviz user profile", () => {
  test("check allowed states", async () => {
    const profile = await getRecidivizUserProfile(testEmail);

    // these values are defined in the env config
    expect(Storage).toHaveBeenCalledWith({ projectId: "test-storage-project" });
    expect(mockStorageBucket).toHaveBeenCalledWith("test-storage-bucket");

    expect(mockStorageFile).toHaveBeenCalledWith(`${testEmail}.json`);
    expect(profile).toContainEntries([
      ["stateCode", "RECIDIVIZ"],
      ["allowedStates", ["US_OZ"]],
    ]);
  });

  test.each(["test", "development", "staging", "demo"])(
    "global write permission in %s",
    async (env) => {
      vi.stubEnv("DEPLOY_ENV", env);
      expect((await getRecidivizUserProfile(testEmail)).permissions).toContain(
        permissionSchema.enum.global_write,
      );
    },
  );

  test("no global write permission in prod", async () => {
    vi.stubEnv("DEPLOY_ENV", "production");
    expect(
      (await getRecidivizUserProfile(testEmail)).permissions,
    ).not.toContain(permissionSchema.enum.global_write);
  });
});
