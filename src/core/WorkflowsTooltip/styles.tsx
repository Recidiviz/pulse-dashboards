/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import styled from "styled-components/macro";

import { TooltipRow, TooltipSectionDetails } from "../sharedComponents";

export const WorkflowsTooltipRow = styled(TooltipRow)`
  justify-content: flex-start;
  padding: 0.25rem 0;
  align-items: center;
`;

export const SectionDetails = styled(TooltipSectionDetails)`
  padding: 0 0 0 0.5rem;
`;
