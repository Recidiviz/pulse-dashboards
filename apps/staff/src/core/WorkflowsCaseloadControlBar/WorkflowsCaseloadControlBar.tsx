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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components/macro";

import WorkflowsCaseloadTabs from "./WorkflowsCaseloadTabs";
import { WorkflowsTabGroupSelector } from "./WorkflowsTabGroupSelector";

const TabControlsMobileView = css`
  @media screen and (max-width: 768px) {
    flex-flow: column-reverse nowrap;
    justify-content: flex-start;
    border-bottom: 0;
    & > * {
      margin-top: ${rem(spacing.sm)};
      width: 100%;
    }
    & > *:not(:last-child) {
      border-bottom: 1px solid ${palette.slate60};
    }
  }
`;

const TabControls = styled.div`
  display: flex;
  flex-flow: row nowrap;
  border-bottom: 1px solid ${palette.slate60};
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${rem(spacing.md)};
  ${TabControlsMobileView}
`;

type WorkflowsCaseloadControlBarPropsWithoutTabControls<T> = Parameters<
  typeof WorkflowsCaseloadTabs<T>
>[0];

type WorkflowsCaseloadControlBarProps<T> =
  WorkflowsCaseloadControlBarPropsWithoutTabControls<T> &
    Parameters<typeof WorkflowsTabGroupSelector>[0];

export function WorkflowsCaseloadControlBar<T>(
  props: WorkflowsCaseloadControlBarPropsWithoutTabControls<T>,
): JSX.Element;
export function WorkflowsCaseloadControlBar<T>(
  props: WorkflowsCaseloadControlBarProps<T>,
): JSX.Element;
export function WorkflowsCaseloadControlBar<T>(
  props:
    | WorkflowsCaseloadControlBarProps<T>
    | WorkflowsCaseloadControlBarPropsWithoutTabControls<T>,
) {
  const { tabs, activeTab, setActiveTab, ...rest } = props;
  return (
    <TabControls>
      {tabs && <WorkflowsCaseloadTabs {...{ tabs, setActiveTab, activeTab }} />}
      {Object.keys(rest).length > 0 && (
        <WorkflowsTabGroupSelector
          {...(rest as Parameters<typeof WorkflowsTabGroupSelector>[0])}
        />
      )}
    </TabControls>
  );
}