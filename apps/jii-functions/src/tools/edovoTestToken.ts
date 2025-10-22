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

import { ArgumentParser } from "argparse";
import { execSync } from "child_process";
import { createPrivateKey, createPublicKey } from "crypto";
import dotenv from "dotenv";
import { CompactEncrypt } from "jose";
import JWT from "jsonwebtoken";
import { join } from "path";

import { secrets } from "../helpers/secrets";
import { SIGNING_KEY_ID } from "../jwks-simulator/keys/public";

const parser = new ArgumentParser({
  description: "Construct an Edovo JWE for local testing",
});

parser.add_argument("-i", "--id", {
  dest: "inmate_id",
  required: true,
  help: "The user ID to include in the payload. This can be for either a real or a demo resident.",
});

parser.add_argument("-s", "--state", {
  dest: "facility_state",
  required: true,
  help: "The state abbreviation to include in the payload. 'OZ', not 'US_OZ'",
});

parser.add_argument("-l", "--lang", {
  dest: "language",
  required: false,
  default: "en",
  help: "The language preference to include in the payload. Defaults to English.",
});

type Args = {
  inmate_id: string;
  facility_state: string;
  language: string;
};

const args = parser.parse_args() as Args;

async function main() {
  // extracts the public key from our private encryption key
  const publicEncryptionKey = createPublicKey(
    createPrivateKey(await secrets.getLatestValue("EDOVO_TOKEN_PRIVATE_KEY")),
  );

  const privateSigningKey = createPrivateKey(
    // there is surely a smarter way to store and use this secret,
    // but we also use this technique in esbuild.config.js and it works just fine.
    // It only requires standard gcloud auth, not GCP JIT permissions
    dotenv.parse(
      execSync(`sops decrypt ${join(__dirname, ".enc.env.secrets")}`),
    )["EDOVO_SIGNING_KEY"],
  ).export({ type: "pkcs8", format: "pem" });

  // simulates a token signed by the Edovo private key. This will only be usable in dev environments
  const { inmate_id, facility_state, language } = args;
  const payload = { inmate_id, facility_state, language };
  const signedToken = JWT.sign(payload, privateSigningKey, {
    keyid: SIGNING_KEY_ID,
    algorithm: "RS256",
    expiresIn: "5min",
  });

  // encrypts the signed token with the public key
  const encryptedToken = await new CompactEncrypt(
    new TextEncoder().encode(signedToken),
  )
    .setProtectedHeader({
      alg: "RSA-OAEP-256",
      enc: "A256GCM",
      cty: "JWT",
    })
    .encrypt(publicEncryptionKey);

  console.log("Visit this URL to simulate an Edovo token login:\n");
  console.log(`http://localhost:4200/edovo/${encryptedToken}`);
}

main();
