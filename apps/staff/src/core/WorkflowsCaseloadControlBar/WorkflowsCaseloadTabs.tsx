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
import { Pill, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

const TabWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: end;
  overflow-x: scroll;
  scrollbar-width: none;
`;

const TabBadge = styled(Pill)<{ $sortable: boolean }>`
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  margin: 0;
  height: 1.6rem;

  ${({ $sortable }) =>
    $sortable &&
    `
    cursor: move;
    &:active {
      cursor: grab;
    }`}
`;

const TabButton = styled.div<{ $active: boolean }>`
  ${typography.Sans16}

  background-color: ${palette.marble1};
  color: ${(props) => (props.$active ? palette.pine4 : palette.text.secondary)};
  padding: 0.5rem 0.25rem;
  border-bottom: 2px solid;
  border-bottom-color: ${(props) =>
    props.$active ? palette.pine4 : `transparent`};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;

  &:not(:last-child) {
    margin-right: 2rem;
  }

  &:hover {
    color: ${({ $active }) => !$active && palette.slate80};

    ${TabBadge} {
      background-color: ${({ $active }) => !$active && palette.slate20};
    }
  }

  &:active {
    cursor: grab;
    z-index: 1;
  }
`;

const TabAnchor = styled(Link)<{ $active: boolean }>`
  ${typography.Sans16}

  background-color: ${palette.marble1};
  color: ${({ $active }) => ($active ? palette.pine4 : palette.text.secondary)};
  padding: 0.5rem 0.25rem;
  border-bottom: 2px solid;
  border-bottom-color: ${({ $active }) =>
    $active ? palette.pine4 : "transparent"};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  white-space: nowrap;

  &:not(:last-child) {
    margin-right: 2rem;
  }

  &:hover {
    color: ${({ $active }) => !$active && palette.slate80};

    ${TabBadge} {
      background-color: ${({ $active }) => !$active && palette.slate20};
    }
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
    border-radius: ${rem(2)};
  }
`;

export interface SortableTabButtonProps<T extends string> {
  tab: T;
  label?: string;
  badge?: number | string;
  active: boolean;
  onClick: (tab: T) => void;
  sortingEnabled: boolean;
}

function SortableTabButton<T extends string>({
  tab,
  label,
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
      {label ?? (tab as string)}
      {badge !== undefined && (
        <TabBadge
          filled
          color={active ? palette.pine4 : palette.slate10}
          textColor={active ? "white" : palette.slate70}
          $sortable={sortingEnabled}
        >
          {badge}
        </TabBadge>
      )}
    </TabButton>
  );
}

type WorkflowsCaseloadTabsBase<T extends string> = {
  tabs: T[];
  tabLabels?: Partial<Record<T, string>>;
  // Loading placeholders (e.g. MyCaseload's skeleton) pass `"--"` while the
  // count is still pending; loaded callers pass `number`. `number` remains
  // assignable to `number | string`, so existing call sites are unaffected.
  tabBadges?: Partial<Record<T, number | string>>;
  activeTab: T;
  setActiveTab: (tab: T) => void;
  sortable?: boolean;
};

export type WorkflowsCaseloadTabsButtonProps<T extends string> =
  WorkflowsCaseloadTabsBase<T> & {
    mode?: "button";
    // Make passing tabHref a type error in button mode.
    tabHref?: never;
  };

export type WorkflowsCaseloadTabsLinkProps<T extends string> =
  WorkflowsCaseloadTabsBase<T> & {
    mode: "link";
    // Required in link mode; the consumer closes over `useLocation()` to
    // upsert the active tab into the URL without baking stale params at
    // construction time.
    tabHref: (tab: T) => string;
  };

export type WorkflowsCaseloadTabsProps<T extends string> =
  | WorkflowsCaseloadTabsButtonProps<T>
  | WorkflowsCaseloadTabsLinkProps<T>;

function WorkflowsCaseloadTabs<T extends string>(
  props: WorkflowsCaseloadTabsProps<T>,
) {
  if (props.mode === "link") {
    return <LinkModeTabs {...props} />;
  }
  return <ButtonModeTabs {...props} />;
}

function ButtonModeTabs<T extends string>({
  tabs,
  tabLabels,
  tabBadges,
  activeTab,
  setActiveTab,
  sortable = false,
}: WorkflowsCaseloadTabsButtonProps<T>) {
  return (
    <TabWrapper>
      {tabs.map((tab: T) => (
        <SortableTabButton
          key={tab as string}
          tab={tab}
          label={tabLabels?.[tab]}
          badge={tabBadges?.[tab]}
          active={activeTab === tab}
          onClick={setActiveTab}
          sortingEnabled={sortable}
        />
      ))}
    </TabWrapper>
  );
}

function LinkModeTabs<T extends string>({
  tabs,
  tabLabels,
  tabBadges,
  activeTab,
  setActiveTab,
  tabHref,
}: WorkflowsCaseloadTabsLinkProps<T>) {
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const focusTab = useCallback((index: number) => {
    const el = tabRefs.current[index];
    if (el) el.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === "ArrowRight") {
        nextIndex = Math.min(index + 1, tabs.length - 1);
      } else if (e.key === "ArrowLeft") {
        nextIndex = Math.max(index - 1, 0);
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex !== null && nextIndex !== index) {
        e.preventDefault();
        setActiveTab(tabs[nextIndex]);
        focusTab(nextIndex);
      }
    },
    [tabs, setActiveTab, focusTab],
  );

  // Keep the refs array tight to the current tab count so we never read a
  // stale ref after an HMR reload that changes the tab set.
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  return (
    <TabWrapper role="tablist" aria-label="Filter caseload">
      {tabs.map((tab: T, index) => {
        const isActive = tab === activeTab;
        const badge = tabBadges?.[tab];
        return (
          <TabAnchor
            key={tab as string}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            to={tabHref(tab)}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            tabIndex={isActive ? 0 : -1}
            $active={isActive}
            onClick={() => {
              // Let the <Link> handle URL navigation (no preventDefault, so
              // cmd-click / ctrl-click / middle-click still open in a new
              // tab). We also notify the parent synchronously so any same-
              // render presenter reader sees the updated category. The
              // URL→presenter useEffect in the page component converges on
              // the next render either way; setActiveTab is belt-and-
              // suspenders for snappiness.
              setActiveTab(tab);
              focusTab(index);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tabLabels?.[tab] ?? (tab as string)}
            {badge !== undefined && (
              <TabBadge
                filled
                color={isActive ? palette.pine4 : palette.slate10}
                textColor={isActive ? "white" : palette.slate70}
                $sortable={false}
                aria-label={`${badge} clients`}
              >
                {badge}
              </TabBadge>
            )}
          </TabAnchor>
        );
      })}
    </TabWrapper>
  );
}

export default WorkflowsCaseloadTabs;
