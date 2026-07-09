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

import { rgba } from "polished";

import { PathwaysTheme } from "~shared-pathways";

import { publicPathwaysPalette } from "./publicPathwaysPalette";
import { publicPathwaysTypography } from "./publicPathwaysTypography";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

export const publicPathwaysTheme: PathwaysTheme = {
  palette: {
    ...publicPathwaysPalette,
  },
  typography: {
    ...publicPathwaysTypography,
    fontFamily: PROXIMA_NOVA_FONT_FAMILY,
  },
  chart: {
    titleColor: "black",
    subtitleColor: rgba("black", 0.6),
    axisLabel: {
      fontFamily: PROXIMA_NOVA_FONT_FAMILY,
      fontWeight: 500,
      fontSize: "11px",
      lineHeight: "16px",
      letterSpacing: "1%",
      color: rgba("black", 0.75),
      charWidth: 10,
    },
  },
  badge: {
    borderColor: "rgba(0, 0, 0, 0.15)",
    color: "rgba(0, 0, 0, 0.4)",
    fontFamily: PROXIMA_NOVA_FONT_FAMILY,
  },
  checkbox: {
    borderColor: "black",
    checkedColor: publicPathwaysPalette.signal.links,
    labelColor: publicPathwaysPalette.pine1,
    labelTypography: publicPathwaysTypography.Sans14,
    titleColor: publicPathwaysPalette.pine1,
  },
  modal: {
    headerFontFamily: PROXIMA_NOVA_FONT_FAMILY,
    headerFontSize: "18px",
    headerFontWeight: 400,
    headerColor: "black",
    backgroundColor: "white",
    closeButtonColor: "rgba(0, 0, 0, 0.60)",
    closeFocusColor: publicPathwaysPalette.focusColor,
    footerBorderColor: "rgba(0, 0, 0, 0.15)",
    resetColor: "black",
  },
  togglePill: {
    borderColor: "rgba(0, 0, 0, 0.15)",
    selectedBackgroundColor: publicPathwaysPalette.focusColor,
    selectedTextColor: "white",
    textColor: "black",
    focusBorderColor: publicPathwaysPalette.focusColor,
    labelTypography: publicPathwaysTypography.Sans14,
  },
};
