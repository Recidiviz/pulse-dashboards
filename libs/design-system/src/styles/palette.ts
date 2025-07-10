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

import { rgb, rgba } from "polished";

const slate = "rgb(43, 84, 105)";
const white = rgb(255, 255, 255);

const basePalette = {
  /* Logo colors */
  logoBlue: rgba(0, 161, 255, 1),
  logoRed: rgba(224, 14, 0, 1),

  /* Marble
     Used mainly for backgrounds and for knockout elements */
  marble1: white,
  marble2: rgb(249, 250, 250),
  marble3: rgb(244, 245, 245),
  marble4: rgb(239, 241, 241),
  marble5: rgb(233, 237, 237),

  /* Slate
     Used mainly for UI elements such as text, icons, and borders */
  slate,
  slate05: rgba(slate, 0.05),
  slate10: rgba(slate, 0.1),
  slate15: rgba(slate, 0.15),
  slate20: rgba(slate, 0.2),
  slate30: rgba(slate, 0.3),
  slate40: rgba(slate, 0.4),
  slate50: rgba(slate, 0.5),
  slate60: rgba(slate, 0.6),
  slate70: rgba(slate, 0.7),
  slate80: rgba(slate, 0.8),
  slate85: rgba(slate, 0.85),
  slate90: rgba(slate, 0.9),

  /* Pink
     Used mainly for status pills
   */
  pink: rgba(255, 220, 229, 1),
  darkPink: rgba(76, 12, 28, 1),

  /* Pine
     Used mainly for UI elements such as text or dark backgrounds */
  pine1: rgb(1, 35, 34),
  pine2: rgb(0, 51, 49),
  pine3: rgb(0, 77, 72),
  pine4: rgb(0, 102, 95),

  white,
  white90: rgba(white, 0.9),
  white80: rgba(white, 0.8),
};

/* Signal
   Used mainly for system alerts, error states, links, tooltips, and highlights */
const signal = {
  links: rgb(0, 108, 103),
  highlight: rgb(37, 184, 148),
  notification: rgb(35, 124, 175),
  error: rgb(164, 57, 57),
  tooltip: rgb(8, 34, 73),
  selected: rgb(55, 151, 205),
};

/* Data
   Used mainly for data visualizations */
const data = {
  forest1: rgb(37, 99, 111),
  forest2: rgb(0, 75, 91),
  gold1: rgb(224, 168, 82),
  gold2: rgb(199, 143, 56),
  crimson1: rgb(202, 68, 73),
  crimson2: rgb(182, 37, 61),
  indigo1: rgb(72, 96, 149),
  indigo2: rgb(50, 77, 133),
  teal1: rgb(139, 177, 186),
  teal2: rgb(97, 142, 152),
  salmon1: rgb(221, 152, 157),
  salmon2: rgb(200, 116, 123),
  defaultOrder: [] as string[],
};

data.defaultOrder = [
  data.forest1,
  data.gold1,
  data.crimson1,
  data.indigo1,
  data.teal1,
  data.salmon1,
];

const text = {
  caption: basePalette.slate85,
  links: signal.links,
  normal: basePalette.pine4,
  primary: rgba(47, 55, 55, 1),
  secondary: rgba(94, 110, 110, 1),
};

export const palette = {
  ...basePalette,
  signal,
  data,
  text,
};
