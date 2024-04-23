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
import { toTitleCase } from "@artsy/to-title-case";
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
  typography,
} from "@recidiviz/design-system";
import styled from "styled-components/macro";

const SelectorDropdown = styled(Dropdown)``;
const SelectorDropdownToggleButtonText = styled.div`
  ${typography.Sans14};
  text-overflow: ellipsis;
  overflow: hidden;
`;
const SelectorDropdownToggleButton = styled(DropdownToggle).attrs({
  kind: "borderless",
  size: "sm",
  showCaret: true,
})`
  color: ${palette.signal.links};
  white-space: nowrap;
`;
const SelectorDropdownMenu = styled(DropdownMenu).attrs({
  alignment: "left",
})`
  background: #ffffff;
  box-shadow:
    0px 0px 1px rgba(43, 84, 105, 0.1),
    0px 4px 8px rgba(43, 84, 105, 0.06),
    0px 8px 56px rgba(43, 84, 105, 0.12);
  border-radius: 8px;
  padding: 12px 0;
  width: max-content;
`;
const SelectorDropdownMenuItem = styled(DropdownMenuItem).attrs({})`
  ${typography.Sans14};
  color: ${palette.pine2};

  :hover {
    background-color: ${palette.slate10};
    color: ${palette.pine2};
  }
`;
const SelectorTitle = styled.div`
  ${typography.Sans14};
  color: ${palette.pine3};
  white-space: nowrap;
`;
const SelectorDropdownToggle = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 210px;
`;

export interface WorkflowsTabGroupSelectorProps {
  title: string;
  tabGroups: string[];
  setActiveTabGroup: (tabGroup: string) => void;
  activeTabGroup: string;
}

export function WorkflowsTabGroupSelector({
  tabGroups,
  title,
  setActiveTabGroup,
  activeTabGroup,
}: WorkflowsTabGroupSelectorProps) {
  return tabGroups.length <= 1 ? null : (
    <SelectorDropdown>
      <SelectorDropdownToggle>
        <SelectorTitle>{title}: </SelectorTitle>
        <SelectorDropdownToggleButton>
          <SelectorDropdownToggleButtonText>
            {toTitleCase(activeTabGroup.toLowerCase())}
          </SelectorDropdownToggleButtonText>
        </SelectorDropdownToggleButton>
      </SelectorDropdownToggle>
      <SelectorDropdownMenu>
        {tabGroups.map((tabGroup) => (
          <SelectorDropdownMenuItem
            onClick={() => setActiveTabGroup(tabGroup)}
            key={tabGroup}
          >
            {toTitleCase(tabGroup.toLowerCase())}
          </SelectorDropdownMenuItem>
        ))}
      </SelectorDropdownMenu>
    </SelectorDropdown>
  );
}
