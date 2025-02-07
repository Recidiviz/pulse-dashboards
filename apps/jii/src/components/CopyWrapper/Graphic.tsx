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

import { FC } from "react";

import { UsMeSentenceCalculation } from "../Graphics/UsMeSentenceCalculation/UsMeSentenceCalculation";
import { ShadowDOM } from "./ShadowDOM";

const COMPONENT_MAPPING: Record<string, FC<Record<string, never>>> = {
  UsMeSentenceCalculation,
};

/**
 * Wrapper for any custom graphics built for inclusion in blocks of copy.
 * If a graphic matching the specified ID is not found, nothing will be rendered.
 */
export const Graphic: FC<{ id?: string }> = ({ id }) => {
  const Cmp = id && COMPONENT_MAPPING[id];
  return Cmp ? (
    <ShadowDOM>
      <Cmp />
    </ShadowDOM>
  ) : null;
};
