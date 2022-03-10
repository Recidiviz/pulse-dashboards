// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { promises } from "fs";
import { GoogleSpreadsheet } from "google-spreadsheet";

import { PathwaysPageIdList } from "../src/core/views";
import { convertCurlyQuotesToStraight } from "../src/utils/formatStrings";

const { readFile, writeFile } = promises;

/**
 * Given a google spreadsheet and a state code, this will extract the page copy
 * for that state and populate a json blob with the content. That blob is then
 * put in a template file and saved in the app content directory.
 */
const createPageCopyFile = async (
  doc: GoogleSpreadsheet,
  stateCode?: string
): Promise<void> => {
  const pageCopySheet =
    doc.sheetsByTitle[stateCode ? `Pages - ${stateCode}` : "Pages"];
  if (pageCopySheet) {
    await pageCopySheet.loadCells();
    const rows = await pageCopySheet.getRows();

    const enabledRows = rows.filter((row) =>
      PathwaysPageIdList.includes(row["Page ID"])
    );

    const content = Object.fromEntries(
      enabledRows.map((row) => [
        row["Page ID"],
        {
          ...(row.Title ? { title: row.Title } : {}),
          ...(row.Summary
            ? { summary: convertCurlyQuotesToStraight(row.Summary) }
            : {}),
          ...(row.Sections ? { sections: JSON.parse(row.Sections) } : {}),
          ...(row.Methodology
            ? { methodology: convertCurlyQuotesToStraight(row.Methodology) }
            : {}),
        },
      ])
    );

    const fileTemplate = await readFile(
      "tools/templates/pageCopy.template",
      "utf-8"
    );

    let copyFileContents = fileTemplate.replace(
      /COPY_CONTENT/,
      JSON.stringify(content, null, 2)
    );

    if (stateCode) {
      copyFileContents = copyFileContents.replace(
        /PageCopy/g,
        "StateSpecificPageCopy"
      );
    }

    const outPath = `src/core/content/page/${
      stateCode ? stateCode.toLowerCase() : "default"
    }.ts`;

    await writeFile(outPath, copyFileContents);
    // eslint-disable-next-line no-console
    console.log(`${outPath} successfully generated.`);
  }
};

export default createPageCopyFile;
