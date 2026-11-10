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

export interface PageRaster {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export interface DetectResult {
  physicalIndex: number;
  label: number;
  rotation: 0 | 180;
  strategy: string | null;
  ocrCalls: number;
  log: string[];
}

export interface LabelMaps {
  labelToPhysical: Map<number, number>;
  physicalToRotation: Map<number, number>;
}

export interface BuildLabelMapsResult extends LabelMaps {
  conflicts: string[];
}

export interface SortAndSplitOptions {
  totalPages?: number;
  skipCompression?: boolean;
}

export interface Base64Result {
  combined: string;
  pages: Map<number, string>;
  metadata: {
    totalPages: number;
    totalOcrCalls: number;
    elapsedMs: number;
    detections: Array<{
      physicalIndex: number;
      label: number;
      rotation: number;
      strategy: string | null;
      ocrCalls: number;
    }>;
  };
  detectionResults: DetectResult[];
}

export interface FilterResult {
  base64: string;
  keptPages: Map<number, number>;
  discardedPages: number[];
  elapsedMs: number;
  totalOcrCalls: number;
}

export interface PageVerification {
  pageIndex: number;
  expectedLabel: number;
  detectedLabel: number | null;
  rotationInPdf: number;
  isCorrectLabel: boolean;
  isCorrectRotation: boolean;
  ocrSnippet: string;
}

export interface PdfTestReport {
  passed: boolean;
  totalPages: number;
  pages: PageVerification[];
  summary: string;
  elapsedMs: number;
}

export interface TestOrderedPdfOptions {
  totalPages?: number;
}

export interface KeptPagesSelection {
  labelToOrientedIndex: Map<number, number>;
  discardedOrientedIndices: number[];
}
