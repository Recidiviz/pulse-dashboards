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
import { csvFormat } from "d3-dsv";
import { flatten } from "flat";
import { writeFile } from "fs/promises";
import { join } from "path";

// ======================
// How to use this script
// ======================
// This script is designed to help you migrate from a locally maintained Typescript
// translation resource file to externally managed, spreadsheet-based resources that
// will be synced to local JSON files. Given a namespace it will treat the `en.ts`
// resource as its reference file and write a CSV to the same directory. Its format
// is the same as the input format of `./syncResource.ts`. Don't leave the file there
// or check it in, but take it and import it into a Google Sheet or whatever your
// technology of choice is for spreading sheets.
// =============
// Example input
// =============
// en.ts > export default {foo: "Hello", bar: {baz: "Goodbye"}}
// ==============
// Example output
// ==============
// | path    | en      |
// | ------- | ------- |
// | foo     | Hello   |
// | bar.baz | Goodbye |

const parser = new ArgumentParser({
  description:
    "Converts the English typescript reference file for a namespace to CSV that can be used for external management",
});

parser.add_argument("-n", "--namespace", {
  dest: "namespace",
  required: true,
  help: "Target namespace. See src/namespaces for options",
});

type Args = {
  namespace: string;
};

const args = parser.parse_args() as Args;

const resourceDirectory = `src/namespaces/${args.namespace}/resources`;
const referenceFile = join(resourceDirectory, "en.ts");

const { default: referenceData } = await import(referenceFile);
const flattenedCsv = csvFormat(
  Object.entries(
    // flattens nested objects into dot notation
    flatten(referenceData) as Record<string, string>,
  ).map(
    // creates rows that csvFormat will convert into column headers
    ([path, en]) => ({ path, en }),
  ),
);

await writeFile(join(resourceDirectory, `${args.namespace}.csv`), flattenedCsv);
