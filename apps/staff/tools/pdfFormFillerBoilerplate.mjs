// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

/* eslint-disable no-console */
import fs from "fs";
import { PDFDocument, PDFRadioGroup } from "pdf-lib";

if (process.argv.length > 2) {
  const uint8Array = fs.readFileSync(process.argv[2]);
  const pdfDoc = await PDFDocument.load(uint8Array);
  const form = pdfDoc.getForm();

  console.log(
    form
      .getFields()
      .map((f) => {
        const opts = f instanceof PDFRadioGroup ? f.getOptions().join() : "";
        return `set("${f.getName()}", formData); // ${
          f.constructor.name
        } ${opts}`;
      })
      .join("\n"),
  );
} else {
  console.log(
    "Pass a PDF with a form as an argument, and this script will print the boilerplate for filling the form with PDFFormFiller.",
  );
}
