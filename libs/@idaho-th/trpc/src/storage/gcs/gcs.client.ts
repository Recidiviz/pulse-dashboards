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
import { AuthClient, GoogleAuth, Impersonated } from "google-auth-library";

import {
  GCS_IMPERSONATION_SOURCE_SCOPES,
  GCS_IMPERSONATION_TARGET_SCOPES,
  GCS_IMPERSONATION_TOKEN_LIFETIME_SECONDS,
  gcsConfig,
} from "~@idaho-th/trpc/storage/gcs/gcs.config";

let storageSingleton: Storage | null = null;
let initPromise: Promise<Storage> | null = null;

function buildStorageFromDedicatedKey(keyFilename: string): Storage {
  return new Storage({
    projectId: gcsConfig.projectId,
    keyFilename,
  });
}

async function buildStorageFromImpersonation(
  targetPrincipal: string,
): Promise<Storage> {
  const auth = new GoogleAuth({
    ...(gcsConfig.impersonationSourceKeyFilename
      ? { keyFilename: gcsConfig.impersonationSourceKeyFilename }
      : {}),
    scopes: [...GCS_IMPERSONATION_SOURCE_SCOPES],
  });

  const sourceClient = await auth.getClient();

  const impersonatedClient: AuthClient = new Impersonated({
    sourceClient,
    targetPrincipal,
    delegates: [],
    targetScopes: [...GCS_IMPERSONATION_TARGET_SCOPES],
    lifetime: GCS_IMPERSONATION_TOKEN_LIFETIME_SECONDS,
  });

  return new Storage({
    projectId: gcsConfig.projectId,
    authClient: impersonatedClient,
  });
}

function buildStorageFromAdc(): Storage {
  return new Storage({ projectId: gcsConfig.projectId });
}

async function buildStorage(): Promise<Storage> {
  if (gcsConfig.dedicatedKeyFilename) {
    return buildStorageFromDedicatedKey(gcsConfig.dedicatedKeyFilename);
  }
  if (gcsConfig.impersonateTarget) {
    return buildStorageFromImpersonation(gcsConfig.impersonateTarget);
  }
  return buildStorageFromAdc();
}

export async function ensureGcsStorageInitialized(): Promise<void> {
  if (storageSingleton) return;
  if (!initPromise) {
    initPromise = buildStorage();
  }
  try {
    storageSingleton = await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  } finally {
    initPromise = null;
  }
}

export function getGcsStorageClient(): Storage {
  if (!storageSingleton) {
    throw new Error(
      "GCS Storage client is not initialized. " +
        "Ensure `ensureGcsStorageInitialized()` is awaited in " +
        "`apps/@idaho-th/server/src/main.ts` before handling requests.",
    );
  }
  return storageSingleton;
}
