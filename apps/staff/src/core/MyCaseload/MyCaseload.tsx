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
import { useCallback, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import styled from "styled-components";

import { palette, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TasksRowEntity } from "../../WorkflowsStore/Task/types";
import { CaseloadSelect } from "../CaseloadSelect";
import { MaxWidthWithSidebar } from "../sharedComponents";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import {
  getMyCaseloadCategoryFromSlug,
  MY_CASELOAD_TAB_SLUGS,
  MyCaseloadBody,
  MyCaseloadTaskCategory,
} from "./MyCaseloadBody";
import { MyCaseloadBodySkeleton } from "./MyCaseloadBodySkeleton";

// No max-width constraint: MyCaseload has no side panel — every row click
// full-page-navigates to the client profile — so the search bar spans the
// page like the tab+filter row below it.
const CaseloadSelectWrapper = styled.div`
  ${MaxWidthWithSidebar}
`;

const MyCaseloadHeading = styled.h1`
  ${typography.Header34}
  color: ${palette.pine2};
  margin: ${rem(spacing.md)} 0 ${rem(spacing.xs)} 0;
`;

const MyCaseloadSubtitle = styled.p`
  ${typography.Body16}
  color: ${palette.slate80};
  margin: 0 0 ${rem(spacing.lg)} 0;
  max-width: 720px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${rem(spacing.xl)} ${rem(spacing.lg)};
  text-align: center;
  gap: ${rem(spacing.sm)};
`;

const EmptyBody = styled.p`
  ${typography.Body16}
  color: ${palette.slate70};
  margin: 0;
  max-width: 480px;
`;

function MyCaseloadInitialState() {
  return (
    <EmptyState>
      <EmptyBody>Select a caseload to see your clients.</EmptyBody>
    </EmptyState>
  );
}

function MyCaseloadEmptyState() {
  return (
    <EmptyState>
      <EmptyBody>No clients match your filters.</EmptyBody>
    </EmptyState>
  );
}

const ManagedComponent = observer(function MyCaseload({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // URL → presenter (continuous). A missing / unknown slug (e.g. no `?tab=` on
  // first load, or a stale ?tab=due-next-month from a Tasks-page bookmark)
  // defaults to ALL_TASKS. We set this explicitly rather than leaning on the
  // presenter's own getter, which otherwise defaults to the first non-empty
  // category (so MyCaseload would open on "Due this month" / "Overdue").
  const slugFromUrl = searchParams.get("tab");
  const categoryFromUrl = getMyCaseloadCategoryFromSlug(slugFromUrl);
  useEffect(() => {
    const target = categoryFromUrl ?? "ALL_TASKS";
    if (presenter.selectedTaskCategory !== target) {
      runInAction(() => {
        presenter.selectedTaskCategory = target;
      });
    }
  }, [categoryFromUrl, presenter]);

  // Presenter → URL via the Link's href: navigation drives the autorun above
  // so we don't need a separate effect.
  const tabHref = useCallback(
    (category: MyCaseloadTaskCategory) => {
      const next = new URLSearchParams(location.search);
      next.set("tab", MY_CASELOAD_TAB_SLUGS[category]);
      return `${location.pathname}?${next.toString()}`;
    },
    [location.pathname, location.search],
  );

  // The skeleton renders before the presenter has hydrated, so its active tab
  // comes from the URL directly (presenter.selectedTaskCategory isn't reliable
  // yet). Defaults to ALL_TASKS.
  const activeTabForUrl = categoryFromUrl ?? "ALL_TASKS";

  // Row link URL — preserves tenantId and any other live query params on the
  // profile URL so navigation keeps the tenant context.
  const rowLinkUrl = useCallback(
    (entity: TasksRowEntity) => {
      const url = new URL(entity.person.profileUrl, window.location.origin);
      searchParams.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      return `${url.pathname}${url.search}`;
    },
    [searchParams],
  );

  return (
    <WorkflowsNavLayout limitedWidth={false}>
      <CaseloadSelectWrapper>
        <CaseloadSelect />
      </CaseloadSelectWrapper>
      <MyCaseloadHeading>My Caseload</MyCaseloadHeading>
      <MyCaseloadSubtitle>
        Use this list of clients to plan your week and prepare for upcoming
        touchpoints.
      </MyCaseloadSubtitle>
      <CaseloadTasksHydrator
        initial={<MyCaseloadInitialState />}
        empty={<MyCaseloadEmptyState />}
        loading={
          <MyCaseloadBodySkeleton
            activeTab={activeTabForUrl}
            tabHref={tabHref}
          />
        }
        hydrated={
          <MyCaseloadBody
            presenter={presenter}
            tabHref={tabHref}
            rowLinkUrl={rowLinkUrl}
          />
        }
      />
    </WorkflowsNavLayout>
  );
});

function usePresenter() {
  const {
    workflowsStore,
    tenantStore,
    analyticsStore,
    firestoreStore,
    tasksFilterStore,
  } = useRootStore();
  const featureVariants = useFeatureVariants();
  return new CaseloadTasksPresenterV2(
    workflowsStore,
    tenantStore,
    tasksFilterStore,
    analyticsStore,
    firestoreStore,
    featureVariants,
  );
}

const MyCaseload = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});

export default MyCaseload;
