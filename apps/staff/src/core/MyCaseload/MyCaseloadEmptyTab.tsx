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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette, typography } from "~design-system";
import { pluralizeWord } from "~utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionTaskCategory } from "../WorkflowsTasks/fixtures";

// Fills the available width (the Tasks-page EmptyTasksTabView is max-width
// constrained); centered, with a sensible min-height so it reads as a real
// empty state even outside a flex parent.
const EmptyTabContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  min-height: ${rem(320)};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${rem(spacing.xl)} ${rem(spacing.lg)};
  text-align: center;
`;

const EmptyTabText = styled.p`
  ${typography.Body16}
  color: ${palette.slate70};
  margin: 0;
  max-width: 520px;
`;

/**
 * Client-oriented empty copy per tab. Unlike the Tasks page's
 * `emptyTabText` (which talks about "contacts or assessments"), MyCaseload is
 * a one-row-per-client view, so the copy is about clients.
 */
function emptyCopy(
  category: SupervisionTaskCategory,
  caseloadTerm: string,
): string {
  switch (category) {
    case "OVERDUE":
      return `There are no clients with overdue tasks for the selected ${caseloadTerm}.`;
    case "DUE_THIS_WEEK":
      return `There are no clients with tasks due within the next week for the selected ${caseloadTerm}.`;
    case "DUE_THIS_MONTH":
      return `There are no clients with tasks due within the next month for the selected ${caseloadTerm}.`;
    default:
      return `There are no clients for the selected ${caseloadTerm}.`;
  }
}

export const MyCaseloadEmptyTab = observer(function MyCaseloadEmptyTab({
  category,
}: {
  category: SupervisionTaskCategory;
}) {
  const { workflowsStore } = useRootStore();
  const caseloadTerm = pluralizeWord({
    term: "caseload",
    count: workflowsStore.searchStore.selectedSearchables.length,
  });

  return (
    <EmptyTabContainer>
      <EmptyTabText>{emptyCopy(category, caseloadTerm)}</EmptyTabText>
    </EmptyTabContainer>
  );
});
