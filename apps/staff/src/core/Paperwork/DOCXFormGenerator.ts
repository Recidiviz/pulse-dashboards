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

import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZip from "pizzip";

import { fetchWorkflowsTemplate } from "./fetchWorkflowsTemplate";

const DEFAULT_EMPTY_SPACE = "        ";

export type DocxTemplateFormContents = Record<string, any>;

type GeneratedFileType = "blob" | "arraybuffer";

export type FileGeneratorArgs = [
  fileName: string,
  templateUrl: DocxUrl,
  formContents: DocxTemplateFormContents,
];

export const renderDocument = (
  formContents: DocxTemplateFormContents,
  template: ArrayBuffer,
  generatedType: GeneratedFileType,
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
  template: ArrayBuffer,
): void => {
  saveAs(renderDocument(formContents, template, "blob"), fileName);
};

export const downloadSingle = async (
  ...[fileName, templateUrl, formContents]: FileGeneratorArgs
): Promise<void> => {
  const template = await fetchWorkflowsTemplate(templateUrl);
  return renderAndSaveDocument(fileName, formContents, template);
};

export const renderDocx = async (
  ...[filename, templateUrl, formContents]: FileGeneratorArgs
): Promise<{ filename: string; fileContents: any }> => {
  const template = await fetchWorkflowsTemplate(templateUrl);
  return {
    filename,
    fileContents: renderDocument(formContents, template, "arraybuffer"),
  };
};

export const renderMultipleDocx = async (
  fileInputs: FileGeneratorArgs[],
): Promise<
  {
    filename: string;
    fileContents: any;
  }[]
> => {
  const renderedDocs = await Promise.all(
    fileInputs.map((fileInput) => renderDocx(...fileInput)),
  );

  return renderedDocs;
};
