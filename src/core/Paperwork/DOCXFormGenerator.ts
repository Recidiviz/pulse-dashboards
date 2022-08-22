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

const renderAndSaveDocument = (
  fileName: string,
  formContents: Record<string, any>,
  template: ArrayBuffer
): void => {
  const zip = new PizZip(template);
  const docxTemplate = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => DEFAULT_EMPTY_SPACE,
  });

  docxTemplate.setData(formContents);
  docxTemplate.render();

  const document = docxTemplate.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  saveAs(document, fileName);
};

export const generate = async (
  fileName: string,
  templateUrl: string,
  formContents: Record<string, any>,
  getTokenSilently: UserStore["getTokenSilently"]
): Promise<void> => {
  const template = await fetchWorkflowsTemplates(templateUrl, getTokenSilently);
  return renderAndSaveDocument(fileName, formContents, template);
};
