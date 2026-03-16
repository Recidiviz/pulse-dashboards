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

import { palette, typography } from "~design-system";

const DEFAULT_FONT_FAMILY = '"Public Sans", sans-serif';

export type PathwaysTheme = {
  palette: typeof palette & { focusColor: string };
  typography: typeof typography & {
    fontFamily: string;
    titleColor: string;
    axisLabelColor: string;
  };
  checkbox: {
    checkedColor: string;
    labelColor: string;
    titleColor: string;
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
    titleColor: palette.pine1,
    axisLabelColor: palette.slate80,
  },
  checkbox: {
    checkedColor: palette.pine3,
    labelColor: palette.pine1,
    titleColor: palette.pine1,
  },
};
