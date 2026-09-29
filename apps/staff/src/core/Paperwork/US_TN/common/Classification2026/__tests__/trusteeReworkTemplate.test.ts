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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import PizZip from "pizzip";

import { trusteeReworkTemplateKeys } from "../trusteeTemplateArgs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REWORK = join(HERE, "..", "trustee_assessment_template_rework.docx");
const LEGACY = join(HERE, "..", "trustee_assessment_template.docx");

function templatePlaceholders(): string[] {
  const zip = new PizZip(readFileSync(REWORK));
  const xml = zip.file("word/document.xml")?.asText() ?? "";

  const text = xml.replace(/<[^>]+>/g, "");

  return [...text.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]);
}

describe("the reworked DOCX template", () => {
  it("asks for exactly the placeholders the form supplies", () => {
    expect([...new Set(templatePlaceholders())].sort()).toEqual(
      [...trusteeReworkTemplateKeys].sort(),
    );
  });

  it("names each placeholder once, so no answer is printed twice", () => {
    const seen = templatePlaceholders();

    expect(seen).toHaveLength(new Set(seen).size);
  });

  it("is not the legacy template", () => {
    expect(readFileSync(REWORK).equals(readFileSync(LEGACY))).toBe(false);
  });
});
