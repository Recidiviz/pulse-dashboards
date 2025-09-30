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
import { csvParse } from "d3-dsv";
import { unflatten } from "flat";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { exit } from "process";

import { TRANSLATOR_MODE_LANGUAGE_CODE } from "../src/constants";

// ======================
// How to use this script
// ======================
// For input you will need a CSV whose contents correspond to an i18next namespace
// (e.g., "common"). Its output will be JSON resource files for the languages in that
// namespace as defined in the CSV.
// There is one required column: "path", which defines the path to each translation segment
// in dot notation. For each additional column whose headers are valid language codes (e.g.,
// "en", "en-US", "es", "fr", etc) the script will generate a JSON file with all non-empty paths.
// Additional columns will be ignored.
// =============
// Example input
// =============
// | path    | en      | es    | notes             |
// | ------- | ------- | ----- | ----------------- |
// | foo     | Hello   | Hola  | here is a note    |
// | bar.baz | Goodbye | Adiós |                   |
// ==============
// Example output
// ==============
// en.json > {"foo": "Hello", "bar": {"baz": "Goodbye"}}
// es.json > {"foo": "Hola", "bar": {"baz": "Adiós"}}

const parser = new ArgumentParser({
  description:
    "Converts a CSV of translation strings into JSON resources for i18next",
});

parser.add_argument("-n", "--namespace", {
  dest: "namespace",
  required: true,
  help: "Target namespace. See src/namespaces for options",
});

parser.add_argument("-f", "--file", {
  dest: "file",
  required: true,
  help: "Path to CSV file",
});

type Args = {
  namespace: string;
  file: string;
};

const args = parser.parse_args() as Args;

const resourceDirectory = `src/namespaces/${args.namespace}/resources`;

/**
 * Validates a purported language/locale tag and canonicalizes it
 * @returns Canonical locale string if valid, undefined if not
 */
function validLanguageTag(tag: string) {
  try {
    const [code] = Intl.getCanonicalLocales(tag);
    return code;
  } catch {
    return;
  }
}

const PATH_COLUMN = "path";

async function makeResourcesFromCsv() {
  const inputData = csvParse(await readFile(args.file, { encoding: "utf8" }));

  const languages = inputData.columns
    .map((cn) => validLanguageTag(cn))
    .filter((v): v is string => !!v);
  console.log(`Detected languages: ${languages.join(", ")}`);

  const ignoredColumns = inputData.columns
    .filter((cn) => cn !== PATH_COLUMN)
    .filter((cn) => !validLanguageTag(cn));
  console.log(`Ignored columns: ${ignoredColumns.join(", ") || "none"}`);

  // generate a resource file for each language
  await Promise.all(
    languages.map(async (lang) => {
      // skip empty cells rather than including empty strings
      // (missing keys support extra behaviors such as fallback to another language)
      const nonEmptySegments = inputData.filter((row) => !!row[lang]);

      // we expect that paths are flattened into dot notation
      const flattenedObjectEntries = nonEmptySegments.map((row) => {
        return [row["path"], row[lang]];
      });
      if (flattenedObjectEntries.some((e) => !e[0]))
        throw new Error(`source data is missing paths for language ${lang}`);

      // unflattening will produce the expected nesting
      const outputData = unflatten(Object.fromEntries(flattenedObjectEntries));
      const outputFile = join(resourceDirectory, `${lang}.json`);

      await writeFile(outputFile, JSON.stringify(outputData, undefined, 2));
    }),
  );

  // generate the "translator mode" resource that lets a user see all keys in context
  // (there is default behavior in i18next that kind of does this but it has some gaps,
  // e.g. when returning objects for destructuring)
  function* generateDevEntries() {
    let index = 0;
    while (index < inputData.length) {
      const path = inputData[index]["path"];
      // ignore empty paths. any that caused actual problems will have already thrown
      if (path) {
        yield [path, `[${args.namespace}]${path}`];
      }

      index++;
    }
  }

  const devOutputData = unflatten(Object.fromEntries(generateDevEntries()));
  const devOutputFile = join(
    resourceDirectory,
    `${TRANSLATOR_MODE_LANGUAGE_CODE}.json`,
  );

  await writeFile(devOutputFile, JSON.stringify(devOutputData, undefined, 2));
}

await makeResourcesFromCsv();

// process hangs if we don't manually exit,
// for reasons unclear it holds onto a bunch of file handles.
// everything should be done by now anyway
exit();
