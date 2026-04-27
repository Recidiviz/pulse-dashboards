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

import React from "react";

import { customPalette } from "../styles/palette";
import * as Styled from "./SentencingAssessmentReport.styles";

export type DispositionFill =
  | { type: "solid"; color: string }
  | {
      type: "pattern";
      patternId:
        | "pdf-dis-dots"
        | "pdf-dis-crosshatch"
        | "pdf-dis-grid"
        | "pdf-dis-horiz-lines";
    };

// Fill config used in both the donut arcs and legend swatches
export const DISPOSITION_FILL: Record<string, DispositionFill> = {
  Probation: { type: "solid", color: customPalette.grey.grey5 },
  "Court-Ordered Treatment": { type: "solid", color: customPalette.grey.grey6 },
  "Suspended Sentence": { type: "pattern", patternId: "pdf-dis-horiz-lines" },
  "< 1 Year Incarceration": { type: "pattern", patternId: "pdf-dis-dots" },
  "1-2 Years Incarceration": {
    type: "pattern",
    patternId: "pdf-dis-crosshatch",
  },
  "3-5 Years Incarceration": { type: "pattern", patternId: "pdf-dis-grid" },
  "6+ Years Incarceration": { type: "solid", color: customPalette.black },
};

export const FALLBACK_FILL: DispositionFill = {
  type: "solid",
  color: customPalette.grey.grey7,
};

/** Returns the SVG fill attribute value (color or url(#id)) for an arc path. */
export function arcFill(config: DispositionFill): string {
  return config.type === "solid" ? config.color : `url(#${config.patternId})`;
}

/** Renders the SVG <defs> patterns referenced by donut arc fills. */
export function DonutPatternDefs() {
  return (
    <defs>
      <pattern
        id="pdf-dis-horiz-lines"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="white" />
        <path d="M0,0L6,6M-1,5L1,7M5,-1L7,1" stroke="black" strokeWidth="0.8" />
      </pattern>
      <pattern
        id="pdf-dis-dots"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="white" />
        <circle cx="3" cy="3" r="1.5" fill="black" />
      </pattern>
      <pattern
        id="pdf-dis-crosshatch"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="white" />
        <path d="M0,6L6,0M-1,1L1,-1M5,7L7,5" stroke="black" strokeWidth="0.8" />
        <path d="M0,0L6,6M-1,5L1,7M5,-1L7,1" stroke="black" strokeWidth="0.8" />
      </pattern>
      <pattern
        id="pdf-dis-grid"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="black" />
        <rect x="1.5" y="1.5" width="3" height="3" fill="white" />
      </pattern>
    </defs>
  );
}

const SWATCH_SIZE = 12;

interface PatternSwatchProps {
  patternId: string;
  patternWidth?: number;
  patternHeight?: number;
  children: React.ReactNode;
}

function PatternSwatch({
  patternId,
  patternWidth = 6,
  patternHeight = 6,
  children,
}: PatternSwatchProps) {
  return (
    <Styled.DispositionSVG width={SWATCH_SIZE} height={SWATCH_SIZE}>
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={patternWidth}
          height={patternHeight}
          patternUnits="userSpaceOnUse"
        >
          {children}
        </pattern>
      </defs>
      <rect
        width={SWATCH_SIZE}
        height={SWATCH_SIZE}
        rx="6"
        fill={`url(#${patternId})`}
      />
    </Styled.DispositionSVG>
  );
}

export function LegendSwatch({ config }: { config: DispositionFill }) {
  if (config.type === "solid")
    return <Styled.DispositionLegendSwatch $color={config.color} />;
  if (config.patternId === "pdf-dis-horiz-lines")
    return (
      <PatternSwatch
        patternId="pdf-dis-horiz-lines"
        patternWidth={4}
        patternHeight={4}
      >
        <rect width="6" height="6" fill="white" />
        <path d="M0,0L6,6M-1,5L1,7M5,-1L7,1" stroke="black" strokeWidth="0.8" />
      </PatternSwatch>
    );
  if (config.patternId === "pdf-dis-dots")
    return (
      <PatternSwatch patternId="ls-dots" patternWidth={4} patternHeight={4}>
        <rect width="4" height="4" fill="white" />
        <circle cx="2" cy="2" r="1" fill="black" />
      </PatternSwatch>
    );
  if (config.patternId === "pdf-dis-crosshatch")
    return (
      <PatternSwatch patternId="ls-crosshatch">
        <rect width="6" height="6" fill="white" />
        <path d="M0,6L6,0M-1,1L1,-1M5,7L7,5" stroke="black" strokeWidth="0.8" />
        <path d="M0,0L6,6M-1,5L1,7M5,-1L7,1" stroke="black" strokeWidth="0.8" />
      </PatternSwatch>
    );
  return (
    <PatternSwatch patternId="ls-grid">
      <rect width="6" height="6" fill="black" />
      <rect x="1.5" y="1.5" width="3" height="3" fill="white" />
    </PatternSwatch>
  );
}
