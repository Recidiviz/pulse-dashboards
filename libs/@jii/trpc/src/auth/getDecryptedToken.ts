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

import { createPrivateKey } from "node:crypto";

import { compactDecrypt } from "jose";

export async function getDecryptedEdovoToken(encryptedToken: string) {
  // decrypting gets us a signed JWT to pass on to the next middleware
  const { plaintext } = await compactDecrypt(
    encryptedToken,
    createPrivateKey(process.env["EDOVO_TOKEN_PRIVATE_KEY"] ?? ""),
  );

  return plaintext.toString();
}
