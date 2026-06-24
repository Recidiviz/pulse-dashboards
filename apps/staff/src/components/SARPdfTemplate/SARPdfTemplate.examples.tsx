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

// Local-only examples for visual iteration on the SAR PDF template. Stripped
// before any rebase onto main — do not import these fixtures from production
// code.
//
// To preview: run `nx examples staff src/components/SARPdfTemplate`, open the
// printed localhost URL, and pick a variant (Default, Populated, NoInsight,
// Signed, Declined, Skipped). Each renders the live PDF via <PDFViewer>.
// =============================================================================

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";

import { SAR, SARInsight, SARPdfTemplate } from "~sentencing-client";

import {
  mockSAR,
  mockSARDeclined,
  mockSARInsight,
  mockSARPopulated,
  mockSARSigned,
  mockSARSkipped,
} from "./SARPdfTemplate.fixtures";

// Required by the custom CSF indexer used by the staff examples renderer.
export default {};

const frameStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "#E2E5E9",
};

const Variant: React.FC<{ sar: SAR; insight?: SARInsight | null }> = ({
  sar,
  insight = null,
}) => (
  <div style={frameStyle}>
    <PDFViewer
      width="100%"
      height="100%"
      showToolbar
      style={{ border: "none" }}
    >
      <SARPdfTemplate sar={sar} insight={insight} />
    </PDFViewer>
  </div>
);

export const Default = () => <Variant sar={mockSAR} insight={mockSARInsight} />;
export const Populated = () => (
  <Variant sar={mockSARPopulated} insight={mockSARInsight} />
);
export const NoInsight = () => <Variant sar={mockSAR} insight={null} />;
export const Signed = () => (
  <Variant sar={mockSARSigned} insight={mockSARInsight} />
);
export const Declined = () => (
  <Variant sar={mockSARDeclined} insight={mockSARInsight} />
);
export const Skipped = () => (
  <Variant sar={mockSARSkipped} insight={mockSARInsight} />
);
