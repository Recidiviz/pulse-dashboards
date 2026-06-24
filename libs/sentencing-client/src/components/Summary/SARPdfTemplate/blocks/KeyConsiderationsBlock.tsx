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

import { Link, Text, View } from "@react-pdf/renderer";
import React from "react";

import { UnderlinedHeading } from "../primitives/UnderlinedHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, font } from "../tokens";
import { AdditionalConsiderations } from "./AdditionalConsiderations";
import { RiskProfileSummary } from "./RiskProfileSummary";

/**
 * Key Considerations block — Risk Profile Summary + Additional Considerations.
 * Hidden entirely when the defendant declined to participate (mirrors the DOM
 * report, which omits this section in that case).
 */
export const KeyConsiderationsBlock: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  if (sar.defendantDeclinedToParticipate) return null;
  return (
    <View style={style}>
      <UnderlinedHeading>Key Considerations</UnderlinedHeading>
      <View>
        <Text>
          The Ohio Risk Assessment System (ORAS) is a validated, evidence-based
          tool used to identify an individual's risk of recidivism and determine
          the appropriate level of supervision and treatment. For further
          information on its application in Missouri, please visit
        </Text>
        <Link
          style={{
            textDecoration: "none",
            color: color.text.default,
            fontWeight: font.weight.bold,
          }}
          href="https://doc.mo.gov/justice-reinvestment-initiative/oras"
        >
          https://doc.mo.gov/justice-reinvestment-initiative/oras
        </Link>
      </View>
      <RiskProfileSummary />
      <AdditionalConsiderations />
    </View>
  );
};
