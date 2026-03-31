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

import downloadjs from "downloadjs";
import JSZip from "jszip";

import {
  configureFilename,
  createMethodologyFile,
  MethodologyFileContent,
  transformChartDataToCsv,
  ZipFileEntry,
} from "~utils";

import { DownloadableData } from "../types";

export type DownloadChartAsDataParams = {
  fileContents: (DownloadableData | undefined)[];
  chartTitle: string;
  filters?: string | null;
  methodologyContent?: MethodologyFileContent[] | null;
  methodologyPDF?: ZipFileEntry | null;
  lastUpdatedOn?: string | null;
  includeFiltersDescriptionInCSV?: boolean;
  dateInPopulation?: string | null;
};

export default async function downloadChartAsData({
  fileContents,
  chartTitle,
  filters = null,
  methodologyContent = null,
  methodologyPDF = null,
  lastUpdatedOn = null,
  includeFiltersDescriptionInCSV = false,
  dateInPopulation = null,
}: DownloadChartAsDataParams): Promise<void> {
  const validContents = fileContents.filter(
    (f): f is NonNullable<DownloadableData> => f != null,
  );

  const csvs = await Promise.all(
    validContents.map((file) =>
      transformChartDataToCsv(
        file.chartDatasets,
        file.chartLabels,
        file.dataExportLabel,
      ),
    ),
  );

  const zip = new JSZip();

  csvs.forEach((csv, index) => {
    const filename = configureFilename(
      validContents[index].chartId,
      dateInPopulation ? { dateInPopulation } : null,
      true,
    );
    const formattedCSV =
      includeFiltersDescriptionInCSV && filters
        ? [filters, csv].join("\n")
        : csv;
    zip.file(`${filename}.csv`, formattedCSV);
  });

  if (methodologyContent) {
    const methodologyFile = createMethodologyFile({
      chartTitle,
      filters,
      methodologyContent,
    });
    zip.file(methodologyFile.name, methodologyFile.data);
  }

  if (methodologyPDF) {
    if (methodologyPDF.type === "binary") {
      zip.file(methodologyPDF.name, methodologyPDF.data, { binary: true });
    } else if (methodologyPDF.type === "base64") {
      zip.file(methodologyPDF.name, methodologyPDF.data, { base64: true });
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  downloadjs(content, "export_data.zip");
}
