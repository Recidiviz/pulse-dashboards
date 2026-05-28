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

import "react-loading-skeleton/dist/skeleton.css";

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import Skeleton from "react-loading-skeleton";
import styled from "styled-components";

import { palette } from "~design-system";

import WorkflowsCaseloadTabs from "../WorkflowsCaseloadControlBar";
import {
  MY_CASELOAD_TAB_LABELS,
  MY_CASELOAD_TASK_CATEGORIES,
  MyCaseloadTaskCategory,
} from "./MyCaseloadBody";

// No max-width constraint — same rationale as MyCaseloadBody's row.
// TODO(#7571): Add Noir/Cool Grey to design system
const SkeletonTabsRow = styled.div`
  border-bottom: #00113326 1px solid;
`;

// Mirror CaseloadTable so the skeleton lines up pixel-for-pixel with the real
// table once data loads: a full-width table whose cells reuse CaseloadTable's
// SharedTableCellStyles (49px tall, xs/sm padding, slate10 bottom border) and
// the same 13%-width columns with the last column expanded to fill.
// See apps/staff/src/core/CaseloadTable/CaseloadTable.tsx.
const SkeletonTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const SkeletonCell = styled.td`
  height: 49px;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  border-bottom: 1px solid ${palette.slate10};
  width: 13%;
  min-width: 125px;

  &:last-child {
    width: auto;
  }
`;

const NUM_ROWS = 8;
const NUM_COLUMNS = 5;

// setActiveTab is required by the link-mode type but is a no-op during loading
// (URL navigation drives re-hydration; see comment at the call site).
const noop = () => undefined;

type MyCaseloadBodySkeletonProps = {
  /** Current tab from the URL (so the right one is highlighted while loading). */
  activeTab: MyCaseloadTaskCategory;
  tabHref: (tab: MyCaseloadTaskCategory) => string;
};

export function MyCaseloadBodySkeleton({
  activeTab,
  tabHref,
}: MyCaseloadBodySkeletonProps) {
  // "--" placeholder for unknown counts. tabBadges accepts string in addition
  // to number to support these loading placeholders.
  const placeholderBadges = Object.fromEntries(
    MY_CASELOAD_TASK_CATEGORIES.map((c) => [c, "--"]),
  ) as Record<MyCaseloadTaskCategory, string>;

  return (
    <div aria-busy="true" aria-label="Loading clients">
      <SkeletonTabsRow>
        <WorkflowsCaseloadTabs<MyCaseloadTaskCategory>
          mode="link"
          tabs={[...MY_CASELOAD_TASK_CATEGORIES]}
          tabLabels={MY_CASELOAD_TAB_LABELS}
          tabBadges={placeholderBadges}
          activeTab={activeTab}
          setActiveTab={noop}
          tabHref={tabHref}
        />
      </SkeletonTabsRow>
      <SkeletonTable>
        <thead>
          <tr>
            {Array.from({ length: NUM_COLUMNS }).map((_, colIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <SkeletonCell as="th" key={colIndex}>
                <Skeleton height={14} width="60%" />
              </SkeletonCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: NUM_ROWS }).map((_, rowIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={rowIndex}>
              {Array.from({ length: NUM_COLUMNS }).map((__, colIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <SkeletonCell key={colIndex}>
                  <Skeleton height={18} />
                </SkeletonCell>
              ))}
            </tr>
          ))}
        </tbody>
      </SkeletonTable>
    </div>
  );
}
