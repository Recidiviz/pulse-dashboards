// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import downloadjs from 'downloadjs';
import * as csvExport from 'jsonexport/dist';

import { timeStamp } from './time';
import infoAboutChart from '../../../utils/charts/info';
import JSZip from 'jszip';
import { humanReadableTitleCase } from '../../../utils/transforms/labels';

// Functions for flowing through browser-specific download functionality
// https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
const isIE = /*@cc_on!@*/false || !!document.documentMode;
const isEdge = !isIE && !!window.StyleMedia;

function configureFilename(chartId, toggleStates, shouldZipDownload) {
  let filename = `${chartId}-${timeStamp()}`;
  if (shouldZipDownload) {
    return filename;
  }

  if (toggleStates.metricType !== undefined) {
    filename = filename.concat('-', toggleStates.metricType);
  }
  if (toggleStates.metricPeriodMonths) {
    filename = filename.concat('-', toggleStates.metricPeriodMonths);
  }
  if (toggleStates.supervisionType) {
    filename = filename.concat('-', toggleStates.supervisionType);
  }
  if (toggleStates.district) {
    filename = filename.concat('-', toggleStates.district);
  }
  return filename;
}

function downloadCanvasImage(canvas, filename, chartTitle, toggleStates, shouldZipDownload) {
  const topPadding = 120;
  const temporaryCanvas = document.createElement('canvas');
  temporaryCanvas.width = canvas.width;
  temporaryCanvas.height = canvas.height + topPadding;

  // Fill the canvas with a white background and the original image
  const destinationCtx = temporaryCanvas.getContext('2d');
  destinationCtx.fillStyle = '#FFFFFF';
  destinationCtx.fillRect(0, 0, canvas.width, canvas.height + topPadding);
  destinationCtx.fillStyle = '#616161';
  destinationCtx.textAlign = 'center';
  destinationCtx.font = '30px Helvetica Neue';
  destinationCtx.fillText(chartTitle, canvas.width / 2, 50);

  if (toggleStates) {
    destinationCtx.fillStyle = '#B8B8B8';
    destinationCtx.textAlign = 'center';
    destinationCtx.font = '16px Helvetica Neue';
    destinationCtx.fillText(`Applied filters: ${getFilters(toggleStates)}`, canvas.width / 2, topPadding - 40);
    destinationCtx.fillText(getViolation(toggleStates), canvas.width / 2, topPadding - 20);
  }

  destinationCtx.drawImage(canvas, 0, topPadding);

  const data = temporaryCanvas.toDataURL('image/png;base64');
  if (shouldZipDownload) {
    return {
      name: filename,
      data: data.substring(22),
      type: "base64"
    }
  } else {
    downloadjs(data, filename, 'image/png;base64');
  }
}

function getFilterValue(filterValue, descriptionPlural, descriptionOne) {
  if (
    filterValue === "All" ||
    ((parseInt(filterValue) === 12 ||
     parseInt(filterValue) === 36 ||
     parseInt(filterValue) === 6 ||
     parseInt(filterValue) === 3) &&
     (descriptionOne === "month"))) {
    return filterValue + " " + descriptionPlural;
  } else if (parseInt(filterValue) === 1 && (descriptionOne === "month")) {
    return filterValue + " " + descriptionOne;
  } else {
    return descriptionOne + humanReadableTitleCase(filterValue.toLowerCase());
  }
}

function formatMetricPeriodMonthsFilter(metricPeriodMonths) {
  switch (metricPeriodMonths) {
    case "1": return "1 month";
    case "3": return "3 months";
    case "6": return "6 months";
    case "12": return "1 year";
    case "36": return "3 years";
    default: return "1 month";
  }
}

const formatDistrict = (district) =>
  district === "All"
    ? "All districts"
    : `District: ${district}`;

const formatChargeCategory = (chargeCategory) =>
  chargeCategory === "All"
    ? "All case types"
    : `Case type: ${humanReadableTitleCase(chargeCategory)}`;

const formatSupervisionType = (supervisionType) =>
  supervisionType === "All"
    ? "All supervision types"
    : `Supervision type: ${humanReadableTitleCase(supervisionType)}`;

export function getFilters(toggleStates) {
  const filters = [];

  if (toggleStates.metricPeriodMonths) {
    filters.push(formatMetricPeriodMonthsFilter(toggleStates.metricPeriodMonths));
  }

  if (toggleStates.district) {
    filters.push(formatDistrict(toggleStates.district));
  }

  if (toggleStates.chargeCategory) {
    filters.push(formatChargeCategory(toggleStates.chargeCategory));
  }

  if (toggleStates.supervisionType) {
    filters.push(formatSupervisionType(toggleStates.supervisionType));
  }

  return filters.join(", ")
}

function getViolation(toggleStates) {
  let str = "";
  if (
    toggleStates.reportedViolations !== undefined ||
    toggleStates.violationType !== undefined ||
    toggleStates.reportedViolations !== "" ||
    toggleStates.violationType !== ""
  ) {
    if (toggleStates.reportedViolations !== undefined && toggleStates.reportedViolations !== "") {
      str += toggleStates.reportedViolations + " violations or notices of citation, ";
    }
    if (toggleStates.violationType !== undefined && toggleStates.violationType !== "") {
      str += "Most severe violation: " + humanReadableTitleCase(toggleStates.violationType.toLowerCase());
    }
    return str;
  }
}

function downloadMethodologyFile(chartId, chartTitle, timeWindowDescription, toggleStates) {
  const filename = "methodology.txt";
  const infoChart = infoAboutChart[chartId] || [];
  const exportDate = new Date().toLocaleDateString('en-US');
  const filters = getFilters(toggleStates);
  const violation = getViolation(toggleStates);

  let text = `Chart: ${chartTitle}\r\n`;
  text += `Dates: ${timeWindowDescription}\r\n`;
  text += `Applied filters:\r\n`;
  text += `- ${filters}\r\n`;

  if (violation) {
    text += `- ${violation}\r\n`;
  }

  text += "\r\n";
  text += `Export Date: ${exportDate}\r\n`;

  infoChart.map((chart) => {
    text += chart.header + "\r\n";
    text += chart.body + "\r\n";
    text += "\r\n";
  });

  return {
    name: filename,
    data: text,
    type: "binary"
  };
}

function downloadZipFile(files, zipFilename) {
  let zip = new JSZip();
  files.map((file) => {
    let fileTypeDescriptor = null;
    if (file.type === "binary") {
      fileTypeDescriptor = { binary: true };
    } else if (file.type === "base64") {
      fileTypeDescriptor = { base64: true };
    } else {
      throw new Error("File type not supported.");
    }
    if (fileTypeDescriptor !== null) {
      zip.file(file.name, file.data, fileTypeDescriptor);
    }
  });
  zip.generateAsync({ type: 'blob' }).then(function (content) {
    downloadjs(content, zipFilename);
  });
}

function downloadObjectAsCsv(exportObj, exportName, shouldZipDownload) {
  const options = {
    mapHeaders: (header) => header.replace(/label|values./, ''),
  };
  let obj = [];

  csvExport(exportObj.series, options, (err, csv) => {
    if (err) throw err;
    const filename = `${exportName}.csv`;

    if ((isIE || isEdge) && !shouldZipDownload) { // User is on Windows
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      navigator.msSaveBlob(blob, filename);
    } else { // User is not on Windows
      const encodedCsv = encodeURIComponent(csv);
      const dataStr = `data:text/csv;charset=utf-8,${encodedCsv}`;
      obj.name = filename;
      obj.data = csv;
      obj.type = "binary";
      if (!shouldZipDownload) {
        downloadjs(dataStr, filename, 'text/csv');
      }
    }
  });

  // We don't need to worry about Windows or not here,
  // because the downstream zip download works across browsers
  return obj;
}

function downloadObjectAsJson(exportObj, exportName) {
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, '\t'))}`;
  const filename = `${exportName}.json`;
  downloadjs(dataStr, filename, 'text/json');
}

function configureDataDownloadButton(
  chartId, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
  convertValuesToNumbers, handleTimeStringLabels, chartTitle, timeWindowDescription, shouldZipDownload, isTable
) {
  return function downloadChartData() {
    const exportData = exportedStructureCallback();

    chartDatasets.forEach((dataset) => {
      if (dataset.label !== 'trendline') {
        const values = {};
        let i = 0;
        let currentYear = '';

        dataset.data.forEach((dataPoint) => {
          let csvLabel = chartLabels[i];
          if (handleTimeStringLabels) {
            const currentLabelParts = chartLabels[i].split(' ');
            if (currentLabelParts.length > 1 && currentLabelParts[1] !== currentYear) {
              currentYear = currentLabelParts[1];
            }
            if (currentLabelParts.length === 1 && currentYear.length > 1) {
              csvLabel = `${csvLabel} ${currentYear}`;
            }
          }

          if ((convertValuesToNumbers === undefined || convertValuesToNumbers) && !isNaN(Number(dataPoint))) {
            values[csvLabel] = Number(dataPoint);
          } else {
            values[csvLabel] = dataPoint;
          }
          i += 1;
        });

        let obj = {};
        if (!isTable) {
          obj.label = dataset.label;
        }
        obj.values = values;
        exportData.series.push(obj);
      }
    });

    const filename = configureFilename(chartId, toggleStates, shouldZipDownload);
    if (shouldZipDownload) {
      const methodologyFile = downloadMethodologyFile(chartId, chartTitle, timeWindowDescription, toggleStates);
      const csvFile = downloadObjectAsCsv(exportData, filename, shouldZipDownload);
      let files = [methodologyFile, csvFile];
      downloadZipFile(files, "export_data.zip");
    } else {
      downloadObjectAsCsv(exportData, filename);
    }

  };
}

function configureImageDownload(canvas, filename, chartTitle, toggleStates, chartId, timeWindowDescription, shouldZipDownload) {
  if (shouldZipDownload) {
    const methodologyFile = downloadMethodologyFile(chartId, chartTitle, timeWindowDescription, toggleStates);
    const imageFile = downloadCanvasImage(canvas, filename, chartTitle, toggleStates, shouldZipDownload);
    const files = [methodologyFile, imageFile];
    downloadZipFile(files, "export_image.zip");
  } else {
    downloadCanvasImage(canvas, filename, chartTitle);
  }
}

function configureDownloadButtons(
  chartId, chartTitle, chartDatasets, chartLabels, chartBox,
  exportedStructureCallback, toggleStates, convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload
) {
  const filename = configureFilename(chartId, toggleStates, shouldZipDownload);
  const downloadChartAsImageButton = document.getElementById(`downloadChartAsImage-${chartId}`);

  if (downloadChartAsImageButton) {
    downloadChartAsImageButton.onclick = function downloadChartImage() {
      configureImageDownload(chartBox || document.getElementById(chartId), `${filename}.png`, chartTitle, toggleStates, chartId, timeWindowDescription, shouldZipDownload);
    };
  }

  const downloadChartDataButton = document.getElementById(`downloadChartData-${chartId}`);
  if (downloadChartDataButton) {
    downloadChartDataButton.onclick = configureDataDownloadButton(
      chartId, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
      convertValuesToNumbers, handleTimeStringLabels, chartTitle, timeWindowDescription, shouldZipDownload
    );
  }

  const downloadMapAsImageButton = document.getElementById(`downloadHtmlElementAsImage-${chartId}`);
  if (downloadMapAsImageButton) {
    downloadMapAsImageButton.onclick = function downloadMapImage() {
      downloadHtmlElementAsImage(
        chartId, chartTitle, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
        convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload
      );
    };
  }
}

function downloadChartAsImage(
  chartId, chartTitle, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
  convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload
) {
  const filename = configureFilename(chartId, toggleStates, shouldZipDownload);
  configureImageDownload(
    document.getElementById(chartId), `${filename}.png`, chartTitle, toggleStates, chartId,
    timeWindowDescription, shouldZipDownload
  );
}

function downloadChartAsData(
  chartId, chartTitle, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
  convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload
) {
  const downloadChartData = configureDataDownloadButton(
    chartId, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
    convertValuesToNumbers, handleTimeStringLabels, chartTitle, timeWindowDescription, shouldZipDownload
  );
  downloadChartData();
}

function downloadHtmlElementAsImage(
  chartId, chartTitle, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
  convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload
) {
  const element = document.getElementById(chartId);

  window.html2canvas(element, {}).then((canvas) => {
    configureImageDownload(
      canvas, `${chartId}-${timeStamp()}.png`, chartTitle, toggleStates, chartId,
      timeWindowDescription, shouldZipDownload
    );
  });
}

function downloadHtmlElementAsData(
  chartId, chartTitle, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
  convertValuesToNumbers, handleTimeStringLabels, timeWindowDescription, shouldZipDownload, isTable
) {
  const downloadChartData = configureDataDownloadButton(
    chartId, chartDatasets, chartLabels, exportedStructureCallback, toggleStates,
    convertValuesToNumbers, handleTimeStringLabels, chartTitle, timeWindowDescription, shouldZipDownload, isTable
  );
  downloadChartData();
}

export {
  downloadCanvasImage,
  downloadObjectAsCsv,
  downloadObjectAsJson,
  configureDownloadButtons,
  downloadChartAsImage,
  downloadChartAsData,
  downloadHtmlElementAsImage,
  downloadHtmlElementAsData,
};
