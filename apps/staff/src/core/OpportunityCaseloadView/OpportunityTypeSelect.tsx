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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useNavigate } from "react-router-dom";
import styled from "styled-components/macro";

import { OpportunityPersonListPresenter } from "../../WorkflowsStore/presenters/OpportunityPersonListPresenter";

const TallerDropdownToggle = styled(DropdownToggle)`
  height: 40px;
`;

const FixedWidthText = styled.span`
  text-align: left;
  width: 180px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SelectedOpportunityTypeIndicator = styled.span`
  width: 8px;
  border-top: 2px solid;
  margin-left: ${rem(spacing.sm)};
`;

export const OpportunityTypeSelect = observer(function OpportunityTypeSelect({
  presenter,
}: {
  presenter: OpportunityPersonListPresenter;
}) {
  const { opportunityConfigs, selectedOpportunityType, opportunityTypes } =
    presenter;
  const navigate = useNavigate();

  if (!opportunityConfigs || !selectedOpportunityType) return null;

  return (
    <Dropdown>
      <TallerDropdownToggle kind="secondary" showCaret>
        <FixedWidthText>
          {opportunityConfigs[selectedOpportunityType].label}
        </FixedWidthText>
      </TallerDropdownToggle>
      <DropdownMenu alignment="left">
        {opportunityTypes.map((oppType) => (
          <DropdownMenuItem
            onClick={() =>
              navigate(presenter.urlForOppConfig(opportunityConfigs[oppType]))
            }
            key={oppType}
          >
            <FlexWrapper>
              {opportunityConfigs[oppType].label}
              {oppType === selectedOpportunityType && (
                <SelectedOpportunityTypeIndicator />
              )}
            </FlexWrapper>
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
});
