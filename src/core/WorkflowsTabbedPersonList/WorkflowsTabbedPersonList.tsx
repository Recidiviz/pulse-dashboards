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

import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

const TabWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  border-bottom: 1px solid ${palette.slate60};
  margin: 2rem 0;
  align-items: end;
`;

const TabButton = styled.div<{ $active: boolean }>`
  ${typography.Sans16}
  color: ${(props) => (props.$active ? palette.pine4 : palette.slate60)};
  padding: 0.5rem 0;
  border-bottom: ${(props) =>
    props.$active ? `1px solid ${palette.pine4}` : "none"};
  margin-right: 2rem;
  cursor: pointer;
`;

interface WorkflowsTabbedPersonListProps<T> {
  tabs: T[];
  activeTab: T;
  onClick: (tab: T) => void;
  children: React.ReactNode;
}

function WorkflowsTabbedPersonList<T extends string>({
  tabs,
  activeTab,
  onClick,
  children,
}: WorkflowsTabbedPersonListProps<T>) {
  return (
    <>
      <TabWrapper>
        {tabs.map((tab: T) => (
          <TabButton
            className="WorkflowsTabbedPersonList__tab"
            key={tab}
            $active={activeTab === tab}
            onClick={() => onClick(tab)}
          >
            {tab}
          </TabButton>
        ))}
      </TabWrapper>
      {children}
    </>
  );
}

export default WorkflowsTabbedPersonList;
