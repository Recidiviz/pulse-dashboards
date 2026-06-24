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

import { Font } from "@react-pdf/renderer";

export const fonts = {
  publicSans: {
    family: "Public Sans",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuFpm5ww.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuJJm5ww.ttf",
        fontWeight: 500,
      },
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuyJ65ww.ttf",
        fontWeight: 600,
      },
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymu8Z65ww.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwAs572Xtc6ZYQws9YVwnNDZpDyNjGolS673tpRgAct.ttf",
        fontWeight: 400,
        fontStyle: "italic" as const,
      },
      {
        src: "https://fonts.gstatic.com/s/publicsans/v21/ijwAs572Xtc6ZYQws9YVwnNDZpDyNjGolS673tq2hwct.ttf",
        fontWeight: 700,
        fontStyle: "italic" as const,
      },
    ],
  },
};

// Register the report font with react-pdf as a side effect on import (the only
// reason a component imports this module). Styles then reference it by family
// name via the `font.family` token.
Font.register(fonts.publicSans);
