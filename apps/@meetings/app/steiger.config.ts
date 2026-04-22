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

import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  { rules: { "fsd/insignificant-slice": "off" } },
  {
    // TODO: remove the block after refactoring
    files: ["./src/env/**", "./src/trpc/**"],
    rules: { "fsd/typo-in-layer-name": "off" },
  },
  {
    // TODO: remove the block after refactoring
    files: [
      "./src/features/recording/**",
      "./src/features/audio-upload/**",
      "./src/entities/upload-segment/**",
    ],
    rules: { "fsd/segments-by-purpose": "off" },
  },
  {
    // TODO: remove the block after refactoring
    files: ["./src/entities/upload-segment/**"],
    rules: { "fsd/no-segmentless-slices": "off" },
  },
]);
