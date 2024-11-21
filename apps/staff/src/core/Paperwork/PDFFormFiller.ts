// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { captureException } from "@sentry/react";
import { saveAs } from "file-saver";
import type { PDFDocument, PDFForm } from "pdf-lib";

import { fetchWorkflowsTemplates } from "../../api/fetchWorkflowsTemplates";

type SetFunc = (fieldName: string, value?: string | boolean | number) => void;

export type PDFFillerFunc = (
  set: SetFunc,
  form: PDFForm,
  doc: PDFDocument,
) => Promise<void>;

// fillerFunc() is the callback responsible for actually filling out the form.
// It is passed a set(fieldName, value) function for setting fields. For more
// advance manipulation, it's also passed the PDFForm object and the PDFDoc object.
// If you need to reference pdf-lib itself, don't forget to import it dynamically.
//
// After setting the fields, calling `form.flatten()` will bake the form into a
// static PDF. To generate the boilerplate needed to fill all the fields in a
// given PDF, run: `nx pdfformfiller-boilerplate staff server/assets/workflowsTemplates/path/to/your.pdf`

export async function fillPDF(
  stateCode: string,
  templateName: string,
  fillerFunc: PDFFillerFunc,
  getTokenSilently: () => Promise<any>,
) {
  // While the template is being downloaded, we also dynamically import pdf-lib as
  // a separate code chunk. Otherwise it would add 200k to the bundle for everyone.
  const [template, pdfLib] = await Promise.all([
    fetchWorkflowsTemplates(stateCode, templateName, getTokenSilently),
    import("pdf-lib"),
  ]);
  const { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField } = pdfLib;
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

  try {
    await fillerFunc(set, form, doc);
  } catch (e) {
    captureException(e);
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

export async function fillAndSavePDF(
  fileName: string,
  stateCode: string,
  templateName: string,
  fillerFunc: PDFFillerFunc,
  getTokenSilently: () => Promise<any>,
) {
  const pdfBytes = await fillPDF(
    stateCode,
    templateName,
    fillerFunc,
    getTokenSilently,
  );

  const blob = new Blob([pdfBytes]);
  saveAs(blob, fileName);
}

export async function fixRadioGroups(form: PDFForm) {
  // If a form field doesn't explicitly specify an appearance for all of its widgets'
  // effective states, pdf-lib will apply the library's default appearance for all the
  // field's widgets. However, some documents use the lack of an `Off` appearance to mean
  // that nothing should be drawn if the widget is off. This function fills in the missing
  // `Off` appearances for all RadioButtonGroups with blank ones.
  // Call it in your fillerFunc if the flattened form's RadioButtonGroups look wrong.
  const { PDFRadioGroup, PDFDict, PDFName } = await import("pdf-lib");
  const offName = PDFName.of("Off");
  form.getFields().forEach((field) => {
    if (field instanceof PDFRadioGroup) {
      field.acroField.getWidgets().forEach((widget) => {
        const { context } = widget.dict;
        const offRef = context.register(context.formXObject([]));
        const normalAppearance = widget.getNormalAppearance();
        if (
          normalAppearance instanceof PDFDict &&
          !normalAppearance.has(offName)
        ) {
          normalAppearance.set(offName, offRef);
        }
      });
    }
  });
}
