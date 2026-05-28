// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TasksRowEntity } from "../../WorkflowsStore/Task/types";
import WorkflowsCaseloadTabs from "../WorkflowsCaseloadControlBar";
import { WorkflowsFilterDropdown } from "../WorkflowsFilters/WorkflowsFilterDropdown";
import { SupervisionTaskCategory } from "../WorkflowsTasks/fixtures";
import { TasksTable } from "../WorkflowsTasks/TasksTable";
import { MyCaseloadEmptyTab } from "./MyCaseloadEmptyTab";

// Local — NOT pulled from presenter.displayedTaskCategories. MyCaseload shows
// a deliberate subset; we don't want DUE_NEXT_MONTH / HIDDEN / state-specific
// buckets leaking in just because the tenant happens to configure them for the
// Tasks page.
export const MY_CASELOAD_TASK_CATEGORIES = [
  "ALL_TASKS",
  "OVERDUE",
  "DUE_THIS_WEEK",
  "DUE_THIS_MONTH",
] as const satisfies readonly SupervisionTaskCategory[];

export type MyCaseloadTaskCategory =
  (typeof MY_CASELOAD_TASK_CATEGORIES)[number];

export const MY_CASELOAD_TAB_LABELS: Record<MyCaseloadTaskCategory, string> = {
  ALL_TASKS: "All Clients",
  OVERDUE: "Overdue",
  DUE_THIS_WEEK: "Due this week",
  DUE_THIS_MONTH: "Due this month",
};

export const MY_CASELOAD_TAB_SLUGS: Record<MyCaseloadTaskCategory, string> = {
  ALL_TASKS: "all-clients",
  OVERDUE: "overdue",
  DUE_THIS_WEEK: "due-this-week",
  DUE_THIS_MONTH: "due-this-month",
};

/**
 * Reverse lookup: URL slug → MyCaseload task category. Returns undefined for
 * unknown / empty / null slugs (e.g. a stale ?tab=due-next-month bookmark from
 * the Tasks page) so callers can fall back to a default category.
 */
export function getMyCaseloadCategoryFromSlug(
  slug: string | null | undefined,
): MyCaseloadTaskCategory | undefined {
  if (!slug) return undefined;
  return MY_CASELOAD_TASK_CATEGORIES.find(
    (category) => MY_CASELOAD_TAB_SLUGS[category] === slug,
  );
}

// Per Figma (node-id 8709-418): the filter dropdown sits inline with the tabs
// on the same row, flush right. The underline spans the full width of the row
// — both the tabs area on the left and the filter area on the right share that
// baseline. `align-items: flex-end` keeps the dropdown anchor aligned with the
// tabs' bottom edge regardless of the dropdown's intrinsic height.
//
// No max-width constraint: MyCaseload has no side panel; the row takes up all
// available horizontal space within `WorkflowsNavLayout limitedWidth={false}`.
const MyCaseloadTabsAndFilterRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  border-bottom: 1px solid ${palette.slate10};
`;

const MyCaseloadTabsArea = styled.div`
  flex: 1;
  min-width: 0; // allow tabs to shrink/scroll horizontally on narrow viewports
`;

const MyCaseloadFilterArea = styled.div`
  flex-shrink: 0;
  margin-bottom: ${rem(spacing.sm)};
`;

type MyCaseloadBodyProps = {
  presenter: CaseloadTasksPresenterV2;
  tabHref: (category: MyCaseloadTaskCategory) => string;
  rowLinkUrl: (entity: TasksRowEntity) => string;
};

export const MyCaseloadBody = observer(function MyCaseloadBody({
  presenter,
  tabHref,
  rowLinkUrl,
}: MyCaseloadBodyProps) {
  const tabBadges = Object.fromEntries(
    MY_CASELOAD_TASK_CATEGORIES.map((c) => [
      c,
      presenter.personsCountForCategory(c),
    ]),
  ) as Record<MyCaseloadTaskCategory, number>;

  const setActiveTab = (tab: MyCaseloadTaskCategory) => {
    runInAction(() => {
      presenter.selectedTaskCategory = tab;
    });
  };

  // If the presenter's category falls outside MyCaseload's tab set (e.g. the
  // user landed on MyCaseload while the presenter still had DUE_NEXT_MONTH
  // selected from a prior Tasks-page session), default the highlight to
  // ALL_TASKS rather than silently rendering no active tab.
  const activeTab = MY_CASELOAD_TASK_CATEGORIES.includes(
    presenter.selectedTaskCategory as never,
  )
    ? (presenter.selectedTaskCategory as MyCaseloadTaskCategory)
    : "ALL_TASKS";

  return (
    <>
      <MyCaseloadTabsAndFilterRow>
        <MyCaseloadTabsArea>
          <WorkflowsCaseloadTabs<MyCaseloadTaskCategory>
            mode="link"
            tabs={[...MY_CASELOAD_TASK_CATEGORIES]}
            tabLabels={MY_CASELOAD_TAB_LABELS}
            tabBadges={tabBadges}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabHref={tabHref}
          />
        </MyCaseloadTabsArea>
        <MyCaseloadFilterArea>
          <WorkflowsFilterDropdown presenter={presenter} />
        </MyCaseloadFilterArea>
      </MyCaseloadTabsAndFilterRow>
      <TasksTable
        presenter={presenter}
        rowLinkUrl={rowLinkUrl}
        renderEmptyState={(p) => (
          <MyCaseloadEmptyTab category={p.selectedTaskCategory} />
        )}
      />
    </>
  );
});
