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

/**
 * Key ID used in local JWKS simulation. This is not the real key ID!
 */
export const SIGNING_KEY_ID = "edovo-simulator-signing-dev-key";

/**
 * Public key in JWK format used to verify JWT signature. This is not the real key!
 * It is only used for the local JWKS simulator. It needs to be in sync with the
 * private key stored in src/tools/.enc.env.secrets. To rotate them you can generate
 * a new keypair online at e.g. https://www.oauth2.dev/tools/generate-keypair or use
 * `jose.exportJWK` on a key generated locally with e.g. `openssl` or `jose.generateKeyPair`
 */
export const EDOVO_SIGNING_KEY = {
  kid: SIGNING_KEY_ID,
  e: "AQAB",
  kty: "RSA",
  n: "3s-9oQ5D2vFTEIZhVEl5ax9V36v5w5dkvZ9b9os_XoB2AWPDhqyNBBwKvfU_65rZ81MZCZQNgLXv-ruDT_BaVEzDUBKUWOohEiomQOb2_kLoqQ8C3YWnIeaQ3gVPxqenhLRzCn5MUD6y8h1E9aXseB4h_L0CgncpAmJgaDow_SmiAkOhQZRTJGjsm1qUQ_G5zcKCXFj9teOE5ls5LXSMBMSf0XhrVA_8xMoxiOZXhqzeNu7631IF1EgsQTqJeLcOrHmfa2bw_yoPUQ4AJqDUJXHVxgtG_riFJSS9Q7ntMzXoDBsCwYO7WtyrYYC24r7iRbPtOmh29GAjf5d2iu54UQ",
};
