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

import { defineSecret } from "firebase-functions/params";

/**
 * Secret key for the Edovo JWKS endpoint
 */
export const EDOVO_API_KEY = defineSecret("EDOVO_API_KEY");
/**
 * Private key for decrypting the ID token
 */
export const EDOVO_TOKEN_PRIVATE_KEY = defineSecret("EDOVO_TOKEN_PRIVATE_KEY");
/**
 * URL for the edovo JWKS endpoint
 */
export const EDOVO_JWKS_URL = defineSecret("EDOVO_JWKS_URL");
/**
 * Expected issuer values. Expect a comma-separated string of values
 */
export const EDOVO_TOKEN_ISSUER = defineSecret("EDOVO_TOKEN_ISSUER");
