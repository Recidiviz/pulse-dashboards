#!/usr/bin/env tsx
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

// Provisions the synthetic-monitor Auth0 test users directly via the Auth0
// Management API from a synthetic-monitor environment directory of per-state
// SOPS files.
//
// Input is the environments/<env>/ directory consumed by the staff-synthetic-monitor
// Terraform component — one <STATE_CODE>.enc.yaml per state, each a map:
//
//   username: <email>
//   password: <password>
//
// For each file we create (or update, if the email already exists in the
// database connection) an internal Recidiviz user scoped to that single state
// via allowedStates. Updates re-apply app_metadata AND the password, so
// rotating a password in SOPS takes effect on the next run — something the old
// bulk-import flow (upsert) could not do.
//
// Auth: the tenant domain and Machine-to-Machine credentials are read from an
// auth0-staff SOPS credentials file ({ auth0_domain, auth0_client_id,
// auth0_client_secret } — the same file the auth0-staff Terraform provider
// uses), passed as the second argument. The nx target's staging/production
// configurations select the matching tenant's file. The M2M application must
// be authorized for the Management API with scopes read:users, create:users,
// update:users. Requests go through the official `auth0` SDK, which retries
// rate-limited (429) responses with backoff, honoring Retry-After.
//
// Usage (from the repo root):
//   nx run @staff/synthetic-monitor-fn:provision-auth0-users -c staging [-- --dry-run]

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

import { ManagementClient } from "auth0";
import chalk from "chalk";

/** The Auth0 database connection the staff test users live in. */
const CONNECTION_NAME =
  process.env["AUTH0_CONNECTION_NAME"] ?? "Username-Password-Authentication";

interface Auth0Credentials {
  domain: string;
  clientId: string;
  clientSecret: string;
}

type AppMetadata = {
  stateCode: string;
  state_code: string;
  allowedStates: string[];
  skip_sync_permissions: boolean;
  synthetic_monitor: boolean;
  routes: Record<string, boolean>;
};

interface SyntheticUser {
  stateCode: string;
  email: string;
  password: string;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

/** Decrypt a SOPS file to a JSON object via the sops CLI. */
function decryptSopsFile(filePath: string): unknown {
  let stdout: string;
  try {
    stdout = execFileSync(
      "sops",
      ["--decrypt", "--output-type", "json", filePath],
      { encoding: "utf8" },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Failed to decrypt ${filePath} with sops:\n${message}`);
  }
  return JSON.parse(stdout) as unknown;
}

function appMetadataForState(stateCode: string): AppMetadata {
  return {
    stateCode: "recidiviz",
    state_code: "recidiviz",
    allowedStates: [stateCode],
    skip_sync_permissions: true,
    // Flags the account for the 00-restrict-synthetic-monitor-ip Auth0 Action,
    // which only lets these users authenticate from the monitor's egress IP.
    synthetic_monitor: true,
    routes: {
      workflows: true,
      workflowsFacilities: true,
      workflowsSupervision: true,
    },
  };
}

/** The Management API credentials from an auth0-staff SOPS credentials file. */
function loadCredentials(filePath: string): Auth0Credentials {
  const decrypted = decryptSopsFile(filePath) as Record<string, unknown>;
  const domain = decrypted?.["auth0_domain"];
  const clientId = decrypted?.["auth0_client_id"];
  const clientSecret = decrypted?.["auth0_client_secret"];
  if (
    typeof domain !== "string" ||
    typeof clientId !== "string" ||
    typeof clientSecret !== "string"
  ) {
    fail(
      `${filePath}: expected the file to decrypt to an ` +
        "{ auth0_domain, auth0_client_id, auth0_client_secret } map.",
    );
  }
  return { domain, clientId, clientSecret };
}

function toSyntheticUser(stateCode: string, decrypted: unknown): SyntheticUser {
  const username = (decrypted as Record<string, unknown>)?.["username"];
  const password = (decrypted as Record<string, unknown>)?.["password"];
  if (typeof username !== "string" || typeof password !== "string") {
    fail(
      `${stateCode}: expected the file to decrypt to a { username, password } map.`,
    );
  }
  return { stateCode, email: username, password };
}

/** The user's id in our database connection, or undefined if not provisioned yet. */
async function findUserId(
  api: ManagementClient,
  email: string,
): Promise<string | undefined> {
  const users = await api.users.listUsersByEmail({ email });
  return users.find((user) =>
    user.identities?.some(
      (identity) => identity.connection === CONNECTION_NAME,
    ),
  )?.user_id;
}

async function createUser(
  api: ManagementClient,
  user: SyntheticUser,
): Promise<void> {
  await api.users.create({
    connection: CONNECTION_NAME,
    email: user.email,
    password: user.password,
    // Synthetic users are provisioned by us; skip the verification email so
    // they can sign in immediately.
    email_verified: true,
    app_metadata: appMetadataForState(user.stateCode),
  });
}

async function updateUser(
  api: ManagementClient,
  userId: string,
  user: SyntheticUser,
): Promise<void> {
  // Auth0 rejects PATCHes that combine `password` with other root attributes,
  // so re-apply the profile and the password in two calls.
  await api.users.update(userId, {
    email_verified: true,
    app_metadata: appMetadataForState(user.stateCode),
  });
  await api.users.update(userId, {
    connection: CONNECTION_NAME,
    password: user.password,
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const [envDir, credentialsFile] = args.filter((arg) => !arg.startsWith("--"));
  if (!envDir || !credentialsFile) {
    fail(
      "Usage: tsx provision-auth0-users.mts <environments/<env> dir> " +
        "<auth0-credentials.enc.yaml> [--dry-run]\n" +
        "Creates or updates the synthetic-monitor Auth0 users via the Management API,\n" +
        "authenticating with the tenant credentials in the given auth0-staff SOPS file.\n" +
        "--dry-run resolves each user and reports would-create/would-update without writing.",
    );
  }

  const files = readdirSync(envDir).filter((f) => f.endsWith(".enc.yaml"));
  if (files.length === 0) {
    fail(`No *.enc.yaml files found in ${envDir}.`);
  }

  const credentials = loadCredentials(credentialsFile);
  process.stderr.write(
    `Provisioning ${chalk.bold(String(files.length))} user(s) on ${chalk.cyan(credentials.domain)}` +
      `${dryRun ? chalk.yellow(" (dry run)") : ""}\n`,
  );
  // The official SDK respects Management API rate limits: 429s (and transient
  // 5xxs) are retried with backoff, honoring the Retry-After header. The
  // default is 2 retries; give sustained-quota bursts more headroom.
  const api = new ManagementClient({
    domain: credentials.domain,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    maxRetries: 5,
  });

  const counterWidth = String(files.length).length;
  let failures = 0;
  // Provision sequentially: a dozen users at most, and in-order output beats
  // the parallel speedup.
  /* eslint-disable no-await-in-loop */
  for (const [index, file] of files.entries()) {
    const stateCode = file.replace(/\.enc\.yaml$/, "");
    const counter = String(index + 1).padStart(counterWidth, "0");
    const prefix = `${chalk.dim(`[${counter}/${files.length}]`)} ${chalk.bold(stateCode)}`;

    const user = toSyntheticUser(
      stateCode,
      decryptSopsFile(path.join(envDir, file)),
    );
    try {
      const userId = await findUserId(api, user.email);
      if (dryRun) {
        process.stderr.write(
          `${prefix} would ${userId ? `update ${userId}` : "create"} (${user.email})\n`,
        );
      } else if (userId) {
        await updateUser(api, userId, user);
        process.stderr.write(
          `${prefix} ${chalk.green("✔")} updated ${userId}\n`,
        );
      } else {
        await createUser(api, user);
        process.stderr.write(`${prefix} ${chalk.green("✔")} created\n`);
      }
    } catch (err) {
      failures += 1;
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`${prefix} ${chalk.red("✘")} ${message}\n`);
    }
  }
  /* eslint-enable no-await-in-loop */

  if (failures > 0) {
    fail(`${chalk.red("✘")} ${failures} of ${files.length} user(s) failed.`);
  }
  process.stderr.write(
    `${chalk.green("✔")} ${dryRun ? "Resolved" : "Provisioned"} all ${files.length} user(s).\n`,
  );
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
});
