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

import { Sans14, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
} from "~design-system";

import { useFeatureVariants } from "../../components/StoreProvider";
import { SupervisionTask, SupervisionTaskType } from "../../WorkflowsStore";
import { type SnoozeOptions } from "../../WorkflowsStore/Task/types";
import { WorkflowsTasksConfig } from "../models/types";

const Wrapper = styled.div`
  justify-self: end;
  cursor: pointer;
`;

const SnoozeTaskDropdownButton = styled(DropdownToggle)<{
  $vertical?: boolean;
}>`
  border: none;
  align-self: center;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  flex-direction: ${({ $vertical }) => ($vertical ? "column" : "row")};
  gap: 2px;

  &:hover,
  &:focus {
    background-color: transparent;
  }

  &:hover {
    > span {
      background-color: ${palette.slate85};
    }
  }
`;

const SnoozeTaskDropdownDot = styled.span`
  height: 4px;
  width: 4px;
  background-color: ${palette.slate60};
  border-radius: 50%;
`;

const SnoozeDropdownMenu = styled(DropdownMenu)`
  min-width: 9rem;
`;

const SnoozeMenuItem = styled(DropdownMenuItem)``;

const SnoozeMenuInstruction = styled(Sans14)`
  padding: 0.5rem 1rem;
  color: ${palette.slate70};
`;

const SnoozedTaskMenu = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const UnhideTaskButton = styled.button`
  ${typography.Sans14};
  border: none;
  text-align: left;
  background: none;
  color: ${palette.pine3};
  padding: 0.5rem 0;

  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

type SnoozeTaskDropdownProps = {
  task: SupervisionTask<SupervisionTaskType>;
  taskConfig?: WorkflowsTasksConfig["tasks"][SupervisionTaskType];
  onSelectSnoozeDays: (snoozeForDays: SnoozeOptions) => void;
};

export const SnoozeTaskDropdown = observer(function SnoozeTaskDropdown({
  task,
  taskConfig,
  onSelectSnoozeDays,
}: SnoozeTaskDropdownProps) {
  const { taskSnoozeReason, tasksPermasnooze } = useFeatureVariants();
  const verticalKebab = Boolean(taskSnoozeReason);

  if (!taskConfig || !taskConfig?.snoozeForOptionsInDays) return null;

  const visibleOptions = tasksPermasnooze
    ? taskConfig.snoozeForOptionsInDays
    : taskConfig.snoozeForOptionsInDays.filter(
        (option) => option !== "FOREVER",
      );

  return (
    <Wrapper>
      <Dropdown>
        <SnoozeTaskDropdownButton
          className="SnoozeTaskDropdownButton"
          $vertical={verticalKebab}
        >
          <SnoozeTaskDropdownDot />
          <SnoozeTaskDropdownDot />
          <SnoozeTaskDropdownDot />
        </SnoozeTaskDropdownButton>

        <SnoozeDropdownMenu alignment="right">
          <>
            <SnoozeMenuInstruction>
              {task.isSnoozed ? (
                <SnoozedTaskMenu>
                  <UnhideTaskButton
                    type="submit"
                    onClick={() => task.updateSupervisionTask(undefined)}
                  >
                    Unhide
                  </UnhideTaskButton>
                </SnoozedTaskMenu>
              ) : (
                `Hide from tasks list for...`
              )}
            </SnoozeMenuInstruction>
            {!task.isSnoozed &&
              visibleOptions.map((option) => {
                return (
                  <SnoozeMenuItem
                    key={`snooze-days-${option}`}
                    onClick={() => onSelectSnoozeDays(option)}
                  >
                    {option === "FOREVER" ? "Forever" : `${option} days`}
                  </SnoozeMenuItem>
                );
              })}
          </>
        </SnoozeDropdownMenu>
      </Dropdown>
    </Wrapper>
  );
});
