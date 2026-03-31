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
import { csvFormat, csvParse } from "d3-dsv";
import { readFileSync, writeFileSync } from "fs";
import { decodeJwt } from "jose";

import { getDecryptedEdovoToken } from "~@jii/trpc";

const parser = new ArgumentParser({
  description:
    "Read a CSV file and decrypt the encrypted_edovo_token field in each row.",
});

parser.add_argument("-i", "--input", {
  dest: "input",
  required: true,
  help: "Path to the input CSV file. Must have an encrypted_edovo_token column.",
});

parser.add_argument("-o", "--output", {
  dest: "output",
  required: true,
  help: "Path to the output CSV file.",
});

type Args = {
  input: string;
  output: string;
};

const args = parser.parse_args() as Args;

async function main() {
  const rows = csvParse(readFileSync(args.input, "utf-8"));

  const results = await Promise.all(
    rows.map(async (row) => {
      const { encrypted_edovo_token: encryptedToken, ...rest } = row;

      if (!encryptedToken) {
        return { ...row, token_error: "missing encrypted_edovo_token" };
      }

      try {
        const decryptedToken = await getDecryptedEdovoToken(encryptedToken);
        const decodedPayload = decodeJwt(decryptedToken);
        const tokenColumns = Object.fromEntries(
          Object.entries(decodedPayload).map(([k, v]) => [
            `token_${k}`,
            String(v),
          ]),
        );
        // excluding encrypted values from decrypted output because they are large and not useful;
        // it is retained in case of error to support troubleshooting
        return { ...rest, ...tokenColumns };
      } catch (e) {
        return { ...row, token_error: String(e) };
      }
    }),
  );

  writeFileSync(args.output, csvFormat(results));
  console.log(`Wrote ${results.length} rows to ${args.output}`);
}

main();
