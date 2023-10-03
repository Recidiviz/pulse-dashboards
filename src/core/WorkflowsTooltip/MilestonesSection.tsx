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

import { Client } from "../../WorkflowsStore";
import {
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
  TooltipTealStar,
} from "../sharedComponents";

export const MilestonesSection: React.FC<{
  milestones: Client["congratulationsMilestones"];
}> = ({ milestones }) => {
  if (!milestones.length) return null;
  return (
    <TooltipSection>
      <TooltipSectionHeader>Milestones</TooltipSectionHeader>
      {milestones.map((m) => (
        <TooltipRow key={m.type}>
          <TooltipTealStar />
          <TooltipSectionDetails>{m.text}</TooltipSectionDetails>
        </TooltipRow>
      ))}
    </TooltipSection>
  );
};
