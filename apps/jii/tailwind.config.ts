// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { join } from "path";
import type { Config } from "tailwindcss";
import {
  isolateInsideOfContainer,
  scopedPreflightStyles,
} from "tailwindcss-scoped-preflight";

// the aliasing machinery does not work for this config file,
// and we don't want to import the entire index barrel file here anyway
// eslint-disable-next-line @nx/enforce-module-boundaries
import { TAILWIND_WRAPPER_CLASS } from "../../libs/@jii/common-ui/src/constants";

const config: Config = {
  content: [join(__dirname, "../../libs/**/*.{js,ts,jsx,tsx,mdx}")],
  theme: {
    extend: {
      screens: {
        screen: { raw: "screen" },
        print: { raw: "print" },
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        public: ['"Public Sans"', "sans-serif"],
      },
    },
  },
  plugins: [
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer(`.${TAILWIND_WRAPPER_CLASS}`),
    }),
  ],
  important: `.${TAILWIND_WRAPPER_CLASS}`,
};
export default config;
