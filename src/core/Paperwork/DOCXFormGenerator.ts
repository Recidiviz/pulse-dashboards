// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZip from "pizzip";

import { fetchWorkflowsTemplates } from "../../api/fetchWorkflowsTemplates";
import UserStore from "../../RootStore/UserStore";

const DEFAULT_EMPTY_SPACE = "        ";

export type DocxTemplateFormContents = Record<string, any>;

type GeneratedFileType = "blob" | "arraybuffer";

export type FileGeneratorArgs = [
  fileName: string,
  stateCode: string,
  templateName: string,
  formContents: DocxTemplateFormContents
];

const renderDocument = (
  formContents: DocxTemplateFormContents,
  template: ArrayBuffer,
  generatedType: GeneratedFileType
) => {
  const zip = new PizZip(template);
  const docxTemplate = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => DEFAULT_EMPTY_SPACE,
  });

  docxTemplate.setData(formContents);
  docxTemplate.render();

  return docxTemplate.getZip().generate({
    type: generatedType,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

const renderAndSaveDocument = (
  fileName: string,
  formContents: DocxTemplateFormContents,
  template: ArrayBuffer
): void => {
  saveAs(renderDocument(formContents, template, "blob"), fileName);
};

export const downloadSingle = async (
  ...[fileName, stateCode, templateName, formContents, getTokenSilently]: [
    ...FileGeneratorArgs,
    UserStore["getTokenSilently"]
  ]
): Promise<void> => {
  const template = await fetchWorkflowsTemplates(
    stateCode,
    templateName,
    getTokenSilently
  );
  return renderAndSaveDocument(fileName, formContents, template);
};

export const downloadMultipleZipped = async (
  zipFileName: string,
  fileInputs: FileGeneratorArgs[],
  getTokenSilently: UserStore["getTokenSilently"]
): Promise<void> => {
  const zip = new PizZip();

  await Promise.all(
    fileInputs.map(
      async ([fileName, stateCode, templateName, formContents]) => {
        const template = await fetchWorkflowsTemplates(
          stateCode,
          templateName,
          getTokenSilently
        );
        const doc = renderDocument(formContents, template, "arraybuffer");
        zip.file(fileName, doc);
      }
    )
  );

  saveAs(zip.generate({ type: "blob" }), zipFileName);
};
