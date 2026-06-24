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

import { View } from "@react-pdf/renderer";
import React from "react";

import { sectionSkipped } from "../derive";
import { Paragraph } from "../primitives/Paragraph";
import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";

export const DefendantStatement: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  // Match the DOM report: hidden when the defendant declined, and omitted
  // entirely (rather than showing a dash) when there's no statement or it was
  // explicitly skipped.
  if (
    sar.defendantDeclinedToParticipate ||
    !sar.defendantStatement ||
    sectionSkipped(sar, "defendantStatement")
  ) {
    return null;
  }
  return (
    // Keep heading attached to its narrative so we don't see a lone label at
    // the bottom of a page with the text on the next.
    <View style={style} wrap={false}>
      <UnderlinedHeading>Defendant&apos;s Version</UnderlinedHeading>
      <Paragraph>{sar.defendantStatement}</Paragraph>
    </View>
  );
};
