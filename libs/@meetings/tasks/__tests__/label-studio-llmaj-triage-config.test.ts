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

import { readFileSync } from "node:fs";

import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  APPLIES_TO_NEITHER,
  LLMAJ_TRIAGE_FINDINGS_ACCURACY,
  LLMAJ_TRIAGE_GRADE,
  LLMAJ_TRIAGE_RESULT_FIELDS,
  LlmajTriageTaskSchema,
} from "~@meetings/tasks/label-studio-llmaj-triage";

// The labeling config pasted into the LLMAJ triage Label Studio project.
const configText = readFileSync(
  new URL("../label-studio/llmaj-triage.xml", import.meta.url),
  "utf8",
);
const config = new JSDOM(configText, { contentType: "text/xml" }).window
  .document;

const elements = Array.from(config.getElementsByTagName("*"));
const taskShape = LlmajTriageTaskSchema.innerType().shape;

// The pattern Label Studio uses to find $field references in an attribute,
// including dotted paths such as $meta.Duration.
const FIELD_REFERENCE = /\$[\w[\].{}]+/g;

function fieldPathsBoundBy(boundElements: Element[]) {
  return [
    ...new Set(
      boundElements.flatMap((element) =>
        Array.from(element.attributes).flatMap((attribute) =>
          (attribute.value.match(FIELD_REFERENCE) ?? []).map((ref) =>
            ref.slice(1),
          ),
        ),
      ),
    ),
  ];
}

const boundFieldPaths = fieldPathsBoundBy(elements);

function schemaForPath(path: string): z.ZodTypeAny | undefined {
  const [field, ...rest] = path.split(".");
  let schema: z.ZodTypeAny | undefined =
    taskShape[field as keyof typeof taskShape];
  for (const key of rest) {
    schema =
      schema instanceof z.ZodObject
        ? (schema.shape as Record<string, z.ZodTypeAny>)[key]
        : undefined;
  }
  return schema;
}

function control(tagName: string, name: string) {
  return elements.find(
    (element) =>
      element.tagName === tagName && element.getAttribute("name") === name,
  );
}

function aliases(choices: Element | undefined) {
  return Array.from(choices?.getElementsByTagName("Choice") ?? []).map(
    (choice) => choice.getAttribute("alias"),
  );
}

describe("LLMAJ triage labeling config", () => {
  // pbcopy without a UTF-8 locale reads the file as Mac Roman, so a
  // non-ASCII character such as a middle dot reaches Label Studio garbled.
  // Write one as a character reference (&#183;) instead.
  test("is plain ASCII", () => {
    expect(configText.match(/[^\t\n\r -~]/g) ?? []).toEqual([]);
  });

  test("parses as XML", () => {
    expect(config.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(config.documentElement.tagName).toBe("View");
  });

  test("binds only fields in LlmajTriageTaskSchema", () => {
    expect(boundFieldPaths.length).toBeGreaterThan(0);
    expect(
      boundFieldPaths.filter((path) => schemaForPath(path) === undefined),
    ).toEqual([]);
  });

  // Label Studio rejects a whole import when any field a Text tag shows is
  // null, so every field the config shows as text must be one the schema
  // never leaves null. Audio is the exception: a meeting with no recording
  // has a null audio field, and the full-review project binds it the same way.
  test("shows as text only fields the schema never leaves null", () => {
    const textFieldPaths = fieldPathsBoundBy(
      elements.filter((element) => element.tagName !== "Audio"),
    );
    expect(
      textFieldPaths.filter((path) => schemaForPath(path)?.isNullable()),
    ).toEqual([]);
  });

  test("gives every tag a unique name and points controls at real tags", () => {
    const names = elements.flatMap(
      (element) => element.getAttribute("name") ?? [],
    );
    expect(new Set(names).size).toBe(names.length);

    const toNames = elements.flatMap(
      (element) => element.getAttribute("toName") ?? [],
    );
    expect(toNames.filter((toName) => !names.includes(toName))).toEqual([]);
  });

  describe.each(Object.entries(LLMAJ_TRIAGE_RESULT_FIELDS))(
    "%s controls",
    (_section, fields) => {
      test("grade is a single choice of the grades", () => {
        const grade = control("Choices", fields.grade);
        expect(grade?.getAttribute("choice")).toBe("single");
        expect(aliases(grade)).toEqual(Object.values(LLMAJ_TRIAGE_GRADE));
      });

      test("findings accuracy is a single choice of the accuracy answers", () => {
        const findingsAccuracy = control("Choices", fields.findingsAccuracy);
        expect(findingsAccuracy?.getAttribute("choice")).toBe("single");
        expect(aliases(findingsAccuracy)).toEqual(
          Object.values(LLMAJ_TRIAGE_FINDINGS_ACCURACY),
        );
      });

      test("notes is a text area", () => {
        expect(control("TextArea", fields.notes)).toBeDefined();
      });
    },
  );

  test("overall applies-to is a required multi-select shown for BAD or PARTIAL", () => {
    const { grade, appliesTo: appliesToName } =
      LLMAJ_TRIAGE_RESULT_FIELDS.OVERALL;
    const appliesTo = control("Choices", appliesToName);
    const gradeValues = Object.fromEntries(
      Array.from(
        control("Choices", grade)?.getElementsByTagName("Choice") ?? [],
      ).map((choice) => [
        choice.getAttribute("alias"),
        choice.getAttribute("value"),
      ]),
    );
    const wrapper = appliesTo?.parentElement;
    expect(wrapper?.getAttribute("visibleWhen")).toBe("choice-selected");
    expect(wrapper?.getAttribute("whenTagName")).toBe(grade);
    expect(wrapper?.getAttribute("whenChoiceValue")).toBe(
      [
        gradeValues[LLMAJ_TRIAGE_GRADE.BAD],
        gradeValues[LLMAJ_TRIAGE_GRADE.PARTIAL],
      ].join(","),
    );

    expect(appliesTo?.getAttribute("choice")).toBe("multiple");
    expect(appliesTo?.getAttribute("required")).toBe("true");
    expect(aliases(appliesTo)).toEqual([
      "CASE_NOTE",
      "ACTION_ITEMS",
      APPLIES_TO_NEITHER,
    ]);
  });
});
