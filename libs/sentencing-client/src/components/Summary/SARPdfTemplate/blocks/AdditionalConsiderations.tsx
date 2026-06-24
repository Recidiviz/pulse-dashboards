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

import { factorsDisplayItems, needsDisplayItems } from "../derive";
import { ScalesIcon } from "../primitives/icons/ScalesIcon";
import { TargetIcon } from "../primitives/icons/TargetIcon";
import { Pill } from "../primitives/Pill";
import { SectionHeading } from "../primitives/SectionHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { space } from "../tokens";

export const AdditionalConsiderations: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const needs = needsDisplayItems(sar);
  const factors = factorsDisplayItems(sar);
  const pills: React.ReactNode[] = [];
  if (needs.length) {
    pills.push(
      <Pill
        key="areas"
        icon={<TargetIcon height={13} width={13} />}
        label="Areas of Need:"
        value={needs.join("\n")}
      />,
    );
  }
  if (factors.length) {
    pills.push(
      <Pill
        key="mitigating"
        icon={<ScalesIcon height={13} width={13} />}
        label="Mitigating Risk Factors:"
        value={factors.join("\n")}
      />,
    );
  }
  if (!pills.length) return null;
  return (
    <View style={style}>
      <SectionHeading
        title={"ADDITIONAL CONSIDERATIONS"}
        meta="As determined by report author"
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space[16],
          paddingVertical: space[4],
        }}
      >
        {pills}
      </View>
    </View>
  );
};
