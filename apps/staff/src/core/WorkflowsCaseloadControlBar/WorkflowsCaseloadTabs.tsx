// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { palette, Pill, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

const TabWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: end;
  overflow-x: scroll;
  scrollbar-width: none;
`;

const TabButton = styled.div<{ $active: boolean }>`
  ${typography.Sans16}
  color: ${(props) => (props.$active ? palette.pine4 : palette.slate60)};
  padding: 0.5rem 0;
  border-bottom: ${(props) =>
    props.$active ? `1px solid ${palette.pine4}` : "none"};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;

  &:not(:last-child) {
    margin-right: 2rem;
  }
`;

const TabBadge = styled(Pill)`
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  height: 1.6rem;
`;

export interface WorkflowsCaseloadTabsProps<T extends string> {
  tabs: T[];
  tabBadges?: Partial<Record<T, number>>;
  activeTab: T;
  setActiveTab: (tab: T) => void;
}

function WorkflowsCaseloadTabs<T extends string>({
  tabs,
  tabBadges,
  activeTab,
  setActiveTab,
}: WorkflowsCaseloadTabsProps<T>) {
  return (
    <TabWrapper>
      {tabs.map((tab: T) => {
        const active = activeTab === tab;
        return (
          <TabButton
            className="WorkflowsTabbedPersonList__tab"
            key={tab as string}
            $active={active}
            onClick={() => setActiveTab(tab)}
          >
            {tab as string}
            {tabBadges?.[tab] && (
              <TabBadge
                filled
                color={active ? palette.pine4 : palette.slate10}
                textColor={active ? "white" : palette.slate70}
              >
                {tabBadges[tab]}
              </TabBadge>
            )}
          </TabButton>
        );
      })}
    </TabWrapper>
  );
}

export default WorkflowsCaseloadTabs;
