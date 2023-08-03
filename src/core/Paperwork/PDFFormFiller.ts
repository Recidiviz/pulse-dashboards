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

import { saveAs } from "file-saver";
import type { PDFDocument, PDFForm } from "pdf-lib";

import { fetchWorkflowsTemplates } from "../../api/fetchWorkflowsTemplates";

type SetFunc = (fieldName: string, value?: string | boolean | number) => void;

export type PDFFillerFunc = (
  set: SetFunc,
  form: PDFForm,
  doc: PDFDocument
) => void;

// To generate the boilerplate needed to fill all the fields in a PDF, run:
// `yarn pdfformfiller-boilerplate path/to/your.pdf`

export async function fillPDF(
  fileName: string,
  stateCode: string,
  templateName: string,
  fillerFunc: PDFFillerFunc,
  getTokenSilently: () => Promise<any>
) {
  // While the template is being downloaded, we also dynamically import pdf-lib as
  // a separate code chunk. Otherwise it would add 200k to the bundle for everyone.
  const [template, { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField }] =
    await Promise.all([
      fetchWorkflowsTemplates(stateCode, templateName, getTokenSilently),
      import("pdf-lib"),
    ]);
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();

  const set: SetFunc = (fieldName, value) => {
    const field = form.getField(fieldName); // If fieldName doesn't exist, this will throw
    if (field instanceof PDFTextField) {
      field.setText((value ?? "").toString());
    } else if (field instanceof PDFCheckBox) {
      if (value) {
        field.check();
      } else {
        field.uncheck();
      }
    } else if (field instanceof PDFRadioGroup) {
      if (value) {
        field.select(value.toString());
      } else {
        field.clear();
      }
    }
  };

  fillerFunc(set, form, doc);

  form.flatten();

  const blob = new Blob([await doc.save()]);
  saveAs(blob, fileName);
}
