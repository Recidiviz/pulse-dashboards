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

import "styled-components";

import { palette, TypographyStyles } from "~design-system";

declare module "styled-components" {
  // Components in ~ui read typography/palette from the styled-components theme
  // so consumer apps can supply their own (e.g. defaultPathwaysTheme,
  // publicPathwaysTheme). This minimum shape is structurally satisfied by
  // PathwaysTheme in ~shared-pathways, so consumer apps do not need to adapt.

  interface DefaultTheme {
    palette: typeof palette;
    typography: TypographyStyles;
  }
}
