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

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

class Secrets {
  private client: SecretManagerServiceClient;

  constructor() {
    this.client = new SecretManagerServiceClient();
  }

  async getLatestValue(secretName: string): Promise<string> {
    const name = `projects/${process.env["SECRETS_PROJECT"]}/secrets/${secretName}/versions/latest`;
    const [secret] = await this.client.accessSecretVersion({ name });
    const secretValue = secret.payload?.data?.toString();
    if (!secretValue) {
      throw new Error(`missing data found for ${name}`);
    }
    return secretValue;
  }
}

// client instantiation depends on environment vars so a global singleton should be fine,
// no need to keep creating new SDK clients
export const secrets = new Secrets();
