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

// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, vue3-vite, etc.
import type { Preview } from "@storybook/react-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

const preview: Preview = {
  tags: ["autodocs"],
  initialGlobals: {
    viewport: { value: "edovoMostCommon", isRotated: false },
  },
  parameters: {
    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
        edovoMostCommon: {
          name: "Edovo tablet (most common)",
          styles: {
            width: "601px",
            height: "826px",
          },
          type: "tablet",
        },
        edovoCommonLandscape: {
          name: "Edovo tablet (most common landscape, Viapath)",
          styles: {
            width: "699px",
            height: "517px",
          },
          type: "tablet",
        },
        edovoSecurusLandscape: {
          name: "Edovo tablet (most common landscape, Securus)",
          styles: {
            width: "962px",
            height: "529px",
          },
          type: "tablet",
        },
        edovoSmallest: {
          name: "Edovo tablet (smallest range)",
          styles: {
            width: "451px",
            height: "594px",
          },
          type: "tablet",
        },
      },
    },
  },
};

export default preview;
