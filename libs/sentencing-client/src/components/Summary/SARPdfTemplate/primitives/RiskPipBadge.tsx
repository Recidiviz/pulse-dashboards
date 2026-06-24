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

import { RiskLevelKey } from "../../../OffenderAssessment/constants";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, space } from "../tokens";
import { Badge } from "./Badge";

export const RISK_FILLED_PIPS: Record<RiskLevelKey, number> = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
};

/** Three-square pip meter + risk Badge (right edge of ORAS domain banners). */
export const RiskPipBadge: React.FC<{
  level: RiskLevelKey;
  style?: PdfStyle;
}> = ({ level, style = {} }) => {
  const filled = RISK_FILLED_PIPS[level];
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: space[6] },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", gap: space[2] }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              backgroundColor:
                i < filled ? color.text.default : color.surface.card,
              borderWidth: i < filled ? 0 : 1,
              borderColor: color.text.default,
            }}
          />
        ))}
      </View>
      <Badge level={level} />
    </View>
  );
};
