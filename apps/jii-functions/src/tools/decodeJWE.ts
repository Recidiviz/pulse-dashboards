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
import { decodeJwt } from "jose";

import { getDecryptedToken } from "../functions/edovoToken/helpers";

const parser = new ArgumentParser({
  description: "Decrypt and decode an Edovo JWE",
});

parser.add_argument("-t", "--token", {
  dest: "token",
  required: true,
  help: "The token to decrypt. Must be in Compact JWE format",
});

type Args = {
  token: string;
};

const args = parser.parse_args() as Args;

async function main() {
  const decryptedToken = await getDecryptedToken(args.token);
  const decodedPayload = decodeJwt(decryptedToken);

  console.log(decodedPayload);
}

main();
