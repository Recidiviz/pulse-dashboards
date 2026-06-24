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

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import {
  RISK_LEVELS,
  RiskLevelKey,
} from "../../../OffenderAssessment/constants";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

const RISK_COLORS: Record<
  RiskLevelKey,
  { bg: string; fg: string; border?: string }
> = {
  HIGH: { bg: color.badge.high.bg, fg: color.badge.high.text },
  MODERATE: { bg: color.badge.moderate.bg, fg: color.badge.moderate.text },
  LOW: { bg: color.badge.low.bg, fg: color.badge.low.text },
};

/**
 * Pill badge with centered label — used by Risk Profile Summary chips
 * (page 1) and as the right-side label in `RiskPipBadge` on per-domain
 * banners. react-pdf's text engine doesn't vertical-center text on its own —
 * wrapping in a flex View with `justifyContent` keeps the glyph optically
 * centered against the pill body, especially at small sizes.
 */
export const Badge: React.FC<{ level: RiskLevelKey; style?: PdfStyle }> = ({
  level,
  style = {},
}) => {
  const c = RISK_COLORS[level];
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: space[4],
          paddingVertical: space[4],
          // Any value taller than the pill height yields a full pill.
          borderRadius: border.radius.full,
          backgroundColor: c.bg,
          borderWidth: c.border ? 0.75 : 0,
          borderColor: c.border ?? c.bg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: font.size.md,
          fontWeight: font.weight.bold,
          textAlign: "center",
          lineHeight: font.lineHeight.none,
          color: c.fg,
        }}
      >
        {RISK_LEVELS[level]}
      </Text>
    </View>
  );
};
