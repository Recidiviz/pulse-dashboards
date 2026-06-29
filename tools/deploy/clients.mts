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

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Octokit } from "@octokit/rest";
import { WebClient as SlackClient } from "@slack/web-api";

/** Decode a Secret Manager access response payload to a string, failing loudly if empty. */
function secretValue(version: {
  name?: string | null;
  payload?: { data?: Uint8Array | string | null } | null;
}): string {
  const data = version.payload?.data;
  if (data == null) {
    throw new Error(
      `Secret ${version.name ?? "(unknown)"} had no payload data`,
    );
  }
  return data.toString();
}

/** Read the latest version of a Secret Manager secret (by short name) as a string. */
async function readSecret(secret: string): Promise<string> {
  const secretClient = new SecretManagerServiceClient({
    projectId: "recidiviz-123",
  });
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/recidiviz-123/secrets/${secret}/versions/latest`,
  });
  return secretValue(version);
}

/** Construct the Octokit client from the deploy-script PAT in Secret Manager. */
export async function createOctokit(): Promise<Octokit> {
  console.log("Reading GitHub access token from Secret Manager...");
  return new Octokit({ auth: await readSecret("github_deploy_script_pat") });
}

/** Construct the Slack client from the deploy bot token in Secret Manager. */
export async function createSlackClient(): Promise<SlackClient> {
  return new SlackClient(
    await readSecret("deploy_slack_bot_authorization_token"),
  );
}
