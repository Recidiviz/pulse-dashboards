// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { observer } from "mobx-react-lite";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import {
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
  TooltipTealStar,
} from "../sharedComponents";

export const OpportunitiesSection: React.FC<{
  person: JusticeInvolvedPerson;
}> = observer(function OpportunitiesSection({ person }) {
  const opportunities = person.flattenedOpportunities;
  if (opportunities.length === 0) {
    return null;
  }

  return (
    <TooltipSection>
      <TooltipSectionHeader>Opportunities</TooltipSectionHeader>
      {opportunities.map((o: Opportunity) => (
        <TooltipRow key={`{${o.selectId}`}>
          <TooltipTealStar />
          <TooltipSectionDetails>
            {o.config.label}
            {o.labelAddendum}
          </TooltipSectionDetails>
        </TooltipRow>
      ))}
    </TooltipSection>
  );
});
