// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";
import { NavigateToFormButton } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import { OpportunityCapsule } from "../PersonCapsules";
import { WorkflowsTooltip } from "../WorkflowsTooltip";

const CellItem = styled.div`
  padding-right: ${rem(spacing.lg)};
`;

const PersonLink = styled.button`
  border: none;
  text-align: left;
  background: none;

  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

const PersonItemWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;

type CaseloadOpportunityCellProps = {
  opportunity: Opportunity;
  style?: React.CSSProperties;
};

export const CaseloadOpportunityCell = observer(
  function CaseloadOpportunityCell({
    opportunity,
    style,
  }: CaseloadOpportunityCellProps) {
    const [showButton, setShowButton] = useState(false);
    const { person } = opportunity;
    const { workflowsStore } = useRootStore();
    const { isTablet } = useIsMobile(true);

    return (
      <CellItem
        key={person.externalId}
        aria-label={`CaseloadOpportunityCell-${person.externalId}`}
        style={style}
      >
        <WorkflowsTooltip
          key={`tooltip-${person.recordId}`}
          aria-label={`CaseloadOpportunityCell-tooltip-${person.recordId}`}
          person={opportunity.person}
        >
          <PersonItemWrapper
            onMouseEnter={() => setShowButton(true)}
            onMouseLeave={() => setShowButton(false)}
          >
            <PersonLink
              className="PersonListItem__Link"
              onClick={() =>
                workflowsStore.updateSelectedPerson(person.pseudonymizedId)
              }
            >
              <OpportunityCapsule
                avatarSize="lg"
                opportunity={opportunity}
                textSize="sm"
                hideId
              />
            </PersonLink>
            {showButton &&
              !isTablet &&
              opportunity.form?.navigateToFormText && (
                <NavigateToFormButton
                  className="NavigateToFormButton"
                  opportunityType={opportunity.type}
                  pseudonymizedId={person.pseudonymizedId}
                >
                  {opportunity.form.navigateToFormText}
                </NavigateToFormButton>
              )}
          </PersonItemWrapper>
        </WorkflowsTooltip>
      </CellItem>
    );
  }
);
