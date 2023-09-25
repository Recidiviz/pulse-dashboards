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
import { observer } from "mobx-react-lite";

import { ReactComponent as TealStar } from "../../assets/static/images/tealStar.svg";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { TooltipSection, TooltipSectionHeader } from "../sharedComponents";
import { SectionDetails, WorkflowsTooltipRow } from "./styles";

export const OpportunitiesSection: React.FC<{
  person: JusticeInvolvedPerson;
  includeStarIcon?: boolean;
}> = observer(function OpportunitiesSection({
  person,
  includeStarIcon = false,
}) {
  const opportunities = Object.values(person.verifiedOpportunities).filter(
    (o: Opportunity) => !!o?.tooltipEligibilityText
  );
  if (opportunities.length === 0) {
    return null;
  }

  return (
    <TooltipSection>
      <TooltipSectionHeader>Opportunities</TooltipSectionHeader>
      {opportunities.map((o: Opportunity) => (
        <WorkflowsTooltipRow key={`{${o.type}-${o.person.recordId}`}>
          {includeStarIcon && <TealStar height="16" width="16" />}
          <SectionDetails>{o.tooltipEligibilityText}</SectionDetails>
        </WorkflowsTooltipRow>
      ))}
    </TooltipSection>
  );
});
