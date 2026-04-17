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
import { unflatten } from "flat";
import { writeFile } from "fs/promises";
import { google, sheets_v4 } from "googleapis";
import { check } from "language-tags";
import { join } from "path";
import { format } from "prettier";
import { exit } from "process";

import { TRANSLATOR_MODE_LANGUAGE_CODE } from "../src/constants";

// ======================
// How to use this script
// ======================
// $ nx sync-resource @jii/translation [-n namespace]
// ============
// Reads a Google Sheets document and converts each sheet into JSON resource files
// for i18next. The spreadsheet ID is read from the TRANSLATIONS_SHEET_ID environment
// variable. Each sheet tab represents one namespace (e.g., "common"). Its contents
// must match the same column layout as the CSV format:
// There are two required columns: "path", which defines the path to each translation
// segment in dot notation, and "en", the English base translation. For each additional
// column whose header is a valid language code (e.g., "es", "fr", etc) the script will
// generate a JSON file with all non-empty paths. Additional columns will be ignored.
// =============
// Example sheet contents
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

/* eslint-disable no-console */

const parser = new ArgumentParser({
  description:
    "Reads a Google Sheets document and converts each sheet into JSON resources for i18next",
});

parser.add_argument("-n", "--namespace", {
  dest: "namespace",
  required: false,
  help: "Target namespace (sheet tab name). If omitted, all tabs are processed.",
});

type Args = {
  namespace: string | undefined;
};

const args = parser.parse_args() as Args;

const spreadsheetId = process.env["TRANSLATIONS_SHEET_ID"];
if (!spreadsheetId)
  throw new Error("TRANSLATIONS_SHEET_ID environment variable is required");

function getSheetsClient(): sheets_v4.Sheets {
  const credentials = process.env["SHEET_API_SERVICE_ACCOUNT"]
    ? {
        client_email: process.env["SHEET_API_SERVICE_ACCOUNT"],
        private_key: process.env["SHEET_API_SERVICE_ACCOUNT_PRIVATE_KEY"],
      }
    : undefined;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getSheetTitles(id: string): Promise<string[]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({ spreadsheetId: id });
  return (response.data.sheets ?? [])
    .map((s) => s.properties?.title ?? "")
    .filter(Boolean);
}

async function fetchSheetData(id: string, namespace: string) {
  const sheets = getSheetsClient();
  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${namespace}!A:ZZ`,
    });
  } catch {
    throw new Error(
      `Sheet "${namespace}" could not be read. Are you sure it exists?`,
    );
  }

  const rows = response.data.values ?? [];
  if (rows.length === 0) throw new Error(`Sheet "${namespace}" is empty`);

  const [columns, ...dataRows] = rows;

  const data = dataRows.map((row) =>
    Object.fromEntries(columns.map((h, i) => [h, row[i] ?? ""])),
  );

  return { data, columns };
}

/**
 * Validates a purported language/locale tag and canonicalizes it
 * @returns Canonical locale string if valid, undefined if not
 */
function validLanguageTag(tag: string) {
  return check(tag) ? Intl.getCanonicalLocales(tag)[0] : undefined;
}

async function writeToJson(data: unknown, path: string) {
  return writeFile(
    path,
    await format(JSON.stringify(data, undefined, 2), {
      parser: "json",
    }),
  );
}

const PATH_COLUMN = "path";
const EN_COLUMN = "en";

async function makeResources(id: string, namespace: string): Promise<Error[]> {
  const resourceDirectory = `src/namespaces/${namespace}/resources`;

  const { data: inputData, columns } = await fetchSheetData(id, namespace);

  const missingColumns = [PATH_COLUMN, EN_COLUMN].filter(
    (c) => !columns.includes(c),
  );
  if (missingColumns.length)
    throw new Error(
      `Sheet "${namespace}" is missing required columns: ${missingColumns.join(", ")}`,
    );

  const languages = columns
    .map((cn) => validLanguageTag(cn))
    .filter((v): v is string => !!v);
  console.log(`[${namespace}] Detected languages: ${languages.join(", ")}`);

  const ignoredColumns = columns
    .filter((cn) => cn !== PATH_COLUMN)
    .filter((cn) => !validLanguageTag(cn));
  console.log(
    `[${namespace}] Ignored columns: ${ignoredColumns.join(", ") || "none"}`,
  );

  // generate a resource file for each language, collecting errors rather than
  // short-circuiting so all languages are attempted regardless of individual failures
  const langResults = await Promise.allSettled(
    languages.map(async (lang) => {
      // skip empty cells rather than including empty strings
      // (missing keys support extra behaviors such as fallback to another language)
      const nonEmptySegments = inputData.filter((row) => !!row[lang]);

      // if the sheet has a language column but no translations yet, leave any
      // existing output file untouched rather than overwriting it with {}
      if (nonEmptySegments.length === 0) {
        console.log(
          `[${namespace}] No translations found for ${lang}, skipping`,
        );
        return;
      }

      // we expect that paths are flattened into dot notation
      const flattenedObjectEntries = nonEmptySegments.map((row) => {
        return [row["path"], row[lang]];
      });
      if (flattenedObjectEntries.some((e) => !e[0]))
        throw new Error("source data is missing paths");

      // unflattening will produce the expected nesting
      const outputData = unflatten(Object.fromEntries(flattenedObjectEntries));

      const outputFile = join(resourceDirectory, `${lang}.json`);

      await writeToJson(outputData, outputFile);
    }),
  );

  const errors = langResults.flatMap((r, i) => {
    if (r.status === "fulfilled") return [];
    const lang = languages[i];
    return [new Error(`[ns: ${namespace}, lang: ${lang}] ${r.reason}`)];
  });

  // generate the "translator mode" resource that lets a user see all keys in context
  // (there is default behavior in i18next that kind of does this but it has some gaps,
  // e.g. when returning objects for destructuring)
  function* generateDevEntries() {
    let index = 0;
    while (index < inputData.length) {
      const path = inputData[index]["path"];
      // ignore empty paths. any that caused actual problems will have already thrown
      if (path) {
        yield [path, `[${namespace}]${path}`];
      }

      index++;
    }
  }

  const devOutputData = unflatten(Object.fromEntries(generateDevEntries()));
  const devOutputFile = join(
    resourceDirectory,
    `${TRANSLATOR_MODE_LANGUAGE_CODE}.json`,
  );

  await writeToJson(devOutputData, devOutputFile);

  return errors;
}

const namespaces = args.namespace
  ? [args.namespace]
  : await getSheetTitles(spreadsheetId);

const nsResults = await Promise.allSettled(
  namespaces.map((ns) => makeResources(spreadsheetId, ns)),
);

const allErrors = nsResults.flatMap((r, i) => {
  if (r.status === "fulfilled") return r.value;
  const ns = namespaces[i];
  const cause = r.reason instanceof Error ? r.reason.message : String(r.reason);
  return [new Error(`[${ns}] ${cause}`)];
});

if (allErrors.length > 0) {
  console.error(`\n${allErrors.length} error(s) occurred:`);
  allErrors.forEach((e) => console.error(` ${e.message}`));
}

// process hangs if we don't manually exit,
// for reasons unclear it holds onto a bunch of file handles.
// everything should be done by now anyway
exit(allErrors.length > 0 ? 1 : 0);
