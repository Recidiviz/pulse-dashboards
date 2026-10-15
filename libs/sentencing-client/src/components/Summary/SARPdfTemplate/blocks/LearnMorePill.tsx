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

import { InfoIcon } from "../primitives/icons/InfoIcon";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { border, color, font, space } from "../tokens";

/**
 * Gray "Visit … to learn more" pill pinned to the bottom of the page the
 * signature content lands on (absolute, not `fixed`, so it renders once).
 */
const DEFAULT_LEARN_MORE_URL = "https://www.mosac.mo.gov/sar-pilot";

const TEXT_LINES = 2;
const TEXT_LINE_HEIGHT = font.lineHeight.tight;
const PADDING_Y = space[8];

/** Height of the pill in points, assuming the sentence wraps to TEXT_LINES
 * lines. The pill is absolutely positioned, so the block above it reserves this
 * much space to keep content from running underneath. */
export const LEARN_MORE_PILL_HEIGHT =
  TEXT_LINES * font.size.md * TEXT_LINE_HEIGHT + 2 * PADDING_Y;

export const LearnMorePill: React.FC<{ url?: string; style?: PdfStyle }> = ({
  url = DEFAULT_LEARN_MORE_URL,
  style = {},
}) => {
  if (!url) return null;
  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: space.pageMargin.bottom,
          left: space.pageMargin.x,
          right: space.pageMargin.x,
          backgroundColor: color.surface.info,
          paddingVertical: PADDING_Y,
          paddingHorizontal: space[12],
          borderRadius: border.radius.md,
          flexDirection: "row",
          alignItems: "center",
          gap: space[8],
        },
        style,
      ]}
    >
      <InfoIcon />
      <Text
        style={{
          flex: 1,
          fontSize: font.size.md,
          lineHeight: TEXT_LINE_HEIGHT,
        }}
      >
        Visit <Text style={{ fontWeight: font.weight.semibold }}>{url}</Text> to
        learn more about the information presented in this report.
      </Text>
    </View>
  );
};
