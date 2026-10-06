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

import type { LabelStudioResult } from "~@meetings/tasks/label-studio-client";

/**
 * Decodes Label Studio annotation results without hardcoding the labeling
 * config's field names.
 *
 * The labeling interface (a `<View>...</View>` XML tree) lives only in the
 * Label Studio admin UI, not in this repo, and it has changed shape/field
 * names before (grade slots renamed, a whole section removed). Rather than
 * hardcoding `from_name` strings like `case_note_accuracy` that will go
 * stale the next time someone edits the config, this parses the config XML
 * fetched live via `LabelStudioClient.getProjectLabelConfig` and uses it to
 * decode `result[]` entries generically.
 */

export interface ChoiceField {
  name: string;
  toName: string;
  /** Maps a Choice's stored value (its literal text, or its alias if one is set) to its alias. */
  aliasByValue: Map<string, string>;
}

export interface TextField {
  name: string;
  toName: string;
}

export interface LabelConfig {
  choiceFields: ChoiceField[];
  textFields: TextField[];
}

function attr(tagAttrs: string, name: string): string | undefined {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tagAttrs);
  return match?.[1];
}

/**
 * Parse a Label Studio `label_config` XML string into the choice/text
 * fields it defines. Uses a tolerant regex scan rather than a full XML
 * parser — LS configs are a flat-ish set of control tags and don't need a
 * real DOM to extract `name`/`toName`/`Choice` attributes.
 */
export function parseLabelConfig(xml: string): LabelConfig {
  const choiceFields: ChoiceField[] = [];
  for (const choicesMatch of xml.matchAll(
    /<Choices\s+([^>]*)>(.*?)<\/Choices>/gis,
  )) {
    const [, tagAttrs, body] = choicesMatch;
    const name = attr(tagAttrs, "name");
    const toName = attr(tagAttrs, "toName");
    if (!name || !toName) continue;

    const aliasByValue = new Map<string, string>();
    for (const choiceMatch of body.matchAll(/<Choice\s+([^>]*)\/?>/gi)) {
      const choiceAttrs = choiceMatch[1];
      const value = attr(choiceAttrs, "value");
      if (!value) continue;
      // A Choice's alias attribute is what actually gets stored on new/edited
      // annotations; annotations saved before an alias was added still store
      // the literal value string, so map both to the same alias.
      aliasByValue.set(value, attr(choiceAttrs, "alias") ?? value);
    }
    choiceFields.push({ name, toName, aliasByValue });
  }

  const textFields: TextField[] = [];
  for (const textAreaMatch of xml.matchAll(/<TextArea\s+([^>]*?)\/?>/gi)) {
    const tagAttrs = textAreaMatch[1];
    const name = attr(tagAttrs, "name");
    const toName = attr(tagAttrs, "toName");
    if (!name || !toName) continue;
    textFields.push({ name, toName });
  }

  return { choiceFields, textFields };
}

export interface DecodedField {
  fromName: string;
  toName: string;
  /** For a choice field: the alias (e.g. "BAD"), or the raw value if the config has no matching field/alias. */
  value: string;
}

/**
 * Decode a single annotation's `result[]` array into human-readable
 * `{ fromName, toName, value }` entries, using the parsed config to resolve
 * choice values to their aliases. Falls back to the raw stored value when a
 * `from_name` isn't found in the config (e.g. the config changed after the
 * annotation was made) so nothing is silently dropped.
 */
export function decodeAnnotationResults(
  config: LabelConfig,
  results: LabelStudioResult[],
): DecodedField[] {
  const choiceFieldsByName = new Map(
    config.choiceFields.map((f) => [f.name, f]),
  );
  const textFieldsByName = new Map(config.textFields.map((f) => [f.name, f]));

  const decoded: DecodedField[] = [];
  for (const result of results) {
    if (result.value.choices) {
      const field = choiceFieldsByName.get(result.from_name);
      for (const rawValue of result.value.choices) {
        decoded.push({
          fromName: result.from_name,
          toName: field?.toName ?? "unknown",
          value: field?.aliasByValue.get(rawValue) ?? rawValue,
        });
      }
    } else if (result.value.text) {
      const field = textFieldsByName.get(result.from_name);
      decoded.push({
        fromName: result.from_name,
        toName: field?.toName ?? "unknown",
        value: result.value.text.join("\n\n"),
      });
    }
  }
  return decoded;
}

/**
 * A grade field decoded as "BAD", paired with any notes (TextArea) fields
 * annotating the same underlying object (matched by `toName` — e.g. a
 * `case_note_accuracy` choice and a `case_note_notes` textarea both point
 * `toName="case_note_display"`).
 */
export interface BadGrade {
  fromName: string;
  toName: string;
  notes: string[];
}

/** Grade/winner aliases are short all-caps tokens; free text notes never look like this. */
function isGradeLikeValue(value: string): boolean {
  return /^[A-Z_]+$/.test(value) && value.length <= 20;
}

/** Find every field in a decoded annotation graded "BAD", with its sibling notes. */
export function findBadGrades(decoded: DecodedField[]): BadGrade[] {
  const notesByToName = new Map<string, string[]>();
  for (const field of decoded) {
    // Heuristic for "this is a notes field, not the grade itself": its
    // decoded value wasn't collapsed to a short alias, i.e. it came from a
    // free-text TextArea rather than a Choices list.
    if (field.value.length > 0 && !isGradeLikeValue(field.value)) {
      const list = notesByToName.get(field.toName) ?? [];
      list.push(field.value);
      notesByToName.set(field.toName, list);
    }
  }

  return decoded
    .filter((field) => field.value === "BAD")
    .map((field) => ({
      fromName: field.fromName,
      toName: field.toName,
      notes: notesByToName.get(field.toName) ?? [],
    }));
}
