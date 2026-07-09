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

import { CSSProp } from "styled-components";

import { palette, typography } from "~design-system";

const DEFAULT_FONT_FAMILY = '"Public Sans", sans-serif';
const DEFAULT_SERIF_FAMILY = '"Libre Baskerville", serif';

export type AxisLabelStyle = {
  fontFamily: string;
  fontWeight: number;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  charWidth: number;
};

export type PathwaysTheme = {
  palette: typeof palette & { focusColor: string };
  typography: typeof typography & {
    fontFamily: string;
  };
  chart: {
    titleColor: string;
    subtitleColor: string;
    axisLabel: AxisLabelStyle;
  };
  badge: {
    borderColor: string;
    color: string;
    fontFamily: string;
  };
  checkbox: {
    borderColor: string;
    checkedColor: string;
    labelColor: string;
    labelTypography: CSSProp;
    titleColor: string;
  };
  modal: {
    headerFontFamily: string;
    headerFontSize: string;
    headerFontWeight: number;
    headerColor: string;
    backgroundColor: string;
    closeButtonColor: string;
    closeFocusColor: string;
    footerBorderColor: string;
    resetColor: string;
  };
  togglePill: {
    borderColor: string;
    selectedBackgroundColor: string;
    selectedTextColor: string;
    textColor: string;
    focusBorderColor: string;
    labelTypography: CSSProp;
  };
};

export const defaultPathwaysTheme: PathwaysTheme = {
  palette: {
    ...palette,
    focusColor: "#006c67",
  },
  typography: {
    ...typography,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  chart: {
    axisLabel: {
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 400,
      fontSize: "12px",
      lineHeight: "normal",
      letterSpacing: "normal",
      color: palette.slate80,
      charWidth: 10,
    },
    titleColor: palette.pine1,
    subtitleColor: palette.slate80,
  },
  badge: {
    borderColor: palette.slate20,
    color: palette.slate60,
    fontFamily: DEFAULT_FONT_FAMILY,
  },
  checkbox: {
    borderColor: palette.slate30,
    checkedColor: palette.pine3,
    labelColor: palette.pine3,
    labelTypography: typography.Sans14,
    titleColor: palette.pine1,
  },
  modal: {
    headerFontFamily: DEFAULT_SERIF_FAMILY,
    headerFontSize: "1.5rem",
    headerFontWeight: 400,
    headerColor: palette.pine2,
    backgroundColor: palette.marble3,
    closeButtonColor: palette.slate70,
    closeFocusColor: palette.signal.links,
    footerBorderColor: palette.slate20,
    resetColor: palette.signal.links,
  },
  togglePill: {
    borderColor: "#d2d8d8",
    selectedBackgroundColor: "#006c67",
    selectedTextColor: "white",
    textColor: palette.pine3,
    focusBorderColor: "#006c67",
    labelTypography: typography.Sans14,
  },
};
