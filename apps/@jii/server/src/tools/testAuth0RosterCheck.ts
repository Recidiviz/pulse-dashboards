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

import { ArgumentParser } from "argparse";
import { createSigner } from "fast-jwt";

const parser = new ArgumentParser({
  description:
    "Call the auth0 roster check endpoint, signing a test token with the real Auth0-paired " +
    "private key. Defaults to a locally running server (via `nx dev jii`, or directly as `nx dev @jii/server`)." +
    "STATE won't work locally since checkAdminPanelPermissions needs ADC " +
    "permissions unavailable in local dev.\n" +
    "Pass the nx configuration to hit staging or production instead, which also selects the " +
    "matching sops secrets (e.g. `env.auth0-roster-check.staging.enc.yaml`):\n" +
    "  nx auth0-roster-check @jii/server -c staging --user-type RECIDIVIZ --email test@recidiviz.org",
});

parser.add_argument("--user-type", {
  dest: "userType",
  required: true,
  choices: ["RECIDIVIZ", "ORIJIN", "STATE"],
  help: "The userType claim to put in the signed token.",
});

parser.add_argument("--email", {
  help: "Required for RECIDIVIZ and STATE user types",
});

parser.add_argument("--user-id", {
  dest: "userId",
  help: "Required for ORIJIN user type",
});

parser.add_argument("--state-code", {
  dest: "stateCode",
  help: "Required for ORIJIN user type, e.g. US_CO",
});

type Args = {
  userType: "RECIDIVIZ" | "ORIJIN" | "STATE";
  email?: string;
  userId?: string;
  stateCode?: string;
};

const args = parser.parse_args() as Args;

function buildPayload(args: Args) {
  switch (args.userType) {
    case "RECIDIVIZ":
    case "STATE":
      if (!args.email) {
        throw new Error(`--email is required for userType ${args.userType}`);
      }
      return { userType: args.userType, email: args.email };
    case "ORIJIN":
      if (!args.userId || !args.stateCode) {
        throw new Error(
          "--user-id and --state-code are required for userType ORIJIN",
        );
      }
      return {
        userType: args.userType,
        userId: args.userId,
        stateCode: args.stateCode,
      };
  }
}

const BASE_URLS: Record<string, string> = {
  staging: "https://staging.opportunities.app",
  production: "https://opportunities.app",
};

async function main() {
  // set by nx from the `-c staging`/`-c production` configuration this script
  // was invoked with, which is also what selects the matching sops secrets. Falls back to a
  // locally running server otherwise.
  const configuration = process.env["NX_TASK_TARGET_CONFIGURATION"];

  if (!configuration && args.userType === "STATE") {
    throw new Error(
      "Cannot test STATE users locally due to admin panel permissions; try with staging or production configuration",
    );
  }

  const baseUrl = configuration
    ? BASE_URLS[configuration]
    : "http://localhost:4200";
  const privateKey = process.env["AUTH0_PRIVATE_KEY"];

  if (!privateKey) {
    throw new Error("Missing required AUTH0_PRIVATE_KEY");
  }

  const sign = createSigner({
    key: privateKey,
    algorithm: "RS256",
    expiresIn: 60_000,
  });
  const token = sign(buildPayload(args));

  const url = `${baseUrl}/api/v1/auth0-roster-check`;
  console.log(`GET ${url}`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("STATUS:", response.status);
  console.log("BODY:", await response.text());
}

main();
