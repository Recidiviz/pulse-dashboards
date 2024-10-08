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

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

  &:hover {
    color: ${({ $active }) => !$active && palette.slate80};
  }

  &:active {
    cursor: grab;
  }
`;

const TabBadge = styled(Pill)<{ $sortable: boolean }>`
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  height: 1.6rem;

  ${({ $sortable }) =>
    $sortable &&
    `
    cursor: move;
    &:active {
      cursor: grab;
    }`}
`;

export interface SortableTabButtonProps<T extends string> {
  tab: T;
  badge?: number;
  active: boolean;
  onClick: (tab: T) => void;
  sortingEnabled: boolean;
}

function SortableTabButton<T extends string>({
  tab,
  badge,
  active,
  onClick,
  sortingEnabled,
}: SortableTabButtonProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tab, disabled: !sortingEnabled });
  const style = {
    transform: CSS.Translate.toString(transform), // Translate only, don't scale tabs by size
    transition,
  };

  return (
    <TabButton
      className="WorkflowsTabbedPersonList__tab"
      key={tab as string}
      $active={active}
      onClick={() => onClick(tab)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {tab as string}
      {badge !== undefined && (
        <TabBadge
          filled
          color={active ? palette.pine4 : palette.slate10}
          textColor={active ? "white" : palette.slate70}
          $sortable={true}
        >
          {badge}
        </TabBadge>
      )}
    </TabButton>
  );
}

export interface WorkflowsCaseloadTabsProps<T extends string> {
  tabs: T[];
  tabBadges?: Partial<Record<T, number>>;
  activeTab: T;
  setActiveTab: (tab: T) => void;
  sortable: boolean;
}

function WorkflowsCaseloadTabs<T extends string>({
  tabs,
  tabBadges,
  activeTab,
  setActiveTab,
  sortable,
}: WorkflowsCaseloadTabsProps<T>) {
  return (
    <TabWrapper>
      {tabs.map((tab: T) => (
        <SortableTabButton
          key={tab as string}
          tab={tab}
          badge={tabBadges?.[tab]}
          active={activeTab === tab}
          onClick={setActiveTab}
          sortingEnabled={sortable}
        />
      ))}
    </TabWrapper>
  );
}

export default WorkflowsCaseloadTabs;
