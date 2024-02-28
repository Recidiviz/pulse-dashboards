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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
  Sans14,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import { formatDate } from "../../utils";
import { SupervisionTask, SupervisionTaskType } from "../../WorkflowsStore";
import { SnoozeTaskConfig } from "../models/types";

const Wrapper = styled.div`
  grid-column-start: 2;
  justify-self: end;
  cursor: pointer;
  position: absolute;
  top: 1.25rem;
`;

const SnoozeTaskDropdownButton = styled(DropdownToggle)`
  border: none;
  align-self: center;
  justify-self: end;
  align-items: baseline;

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
  margin-right: 2px;
  display: inline-block;
`;

const SnoozeDropdownMenu = styled(DropdownMenu)`
  min-width: 9rem;
`;

const SnoozeMenuItem = styled(DropdownMenuItem)``;

const SnoozeMenuInstruction = styled(Sans14)`
  padding: 0.5rem 1rem;
  color: ${palette.slate70};
`;

type SnoozeTaskDropdownProps = {
  task: SupervisionTask<SupervisionTaskType>;
  snoozeTasksConfig?: SnoozeTaskConfig[SupervisionTaskType] | undefined;
};

const ToastWrapper = styled(Sans14)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(40px);
`;

const UndoButton = styled.button`
  ${typography.Sans14};
  border: none;
  text-align: left;
  background: none;
  color: #00a1ff;
  margin-left: 1rem;
  padding: 0;

  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

const snoozeTaskToast = (
  task: SupervisionTask<SupervisionTaskType>,
  snoozeForDays: number,
) => {
  const personName = task.person.displayName;
  return toast(
    (t) => (
      <ToastWrapper>
        {`${personName}'s ${task.displayName} will be hidden from this list for ${snoozeForDays} days. `}
        <UndoButton
          type="submit"
          onClick={() => {
            task.updateSupervisionTask(undefined);
            toast.dismiss(t.id);
          }}
        >
          Undo
        </UndoButton>
      </ToastWrapper>
    ),
    {
      className: "SnoozeTaskToast",
      duration: 3000,
    },
  );
};

const SnoozedTaskMenu = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const UnhideTaskButton = styled(UndoButton)`
  color: ${palette.pine3};
  padding: 0.5rem 0;
  margin-left: 0;
`;

export const SnoozeTaskDropdown = observer(function SnoozeTaskDropdown({
  task,
  snoozeTasksConfig,
}: SnoozeTaskDropdownProps) {
  if (
    !snoozeTasksConfig ||
    !snoozeTasksConfig?.enabled ||
    !snoozeTasksConfig?.snoozeForOptionsInDays
  )
    return null;

  return (
    <Wrapper>
      <Dropdown>
        <SnoozeTaskDropdownButton className="SnoozeTaskDropdownButton">
          <SnoozeTaskDropdownDot />
          <SnoozeTaskDropdownDot />
          <SnoozeTaskDropdownDot />
        </SnoozeTaskDropdownButton>

        <SnoozeDropdownMenu alignment="right">
          <>
            <SnoozeMenuInstruction>
              {task.isSnoozed ? (
                <SnoozedTaskMenu>
                  This task will be hidden from the Tasks list until{" "}
                  {formatDate(task.snoozedUntil)}.
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
              snoozeTasksConfig.snoozeForOptionsInDays.map((option) => {
                return (
                  <SnoozeMenuItem
                    key={`snooze-days-${option}`}
                    onClick={() => {
                      task.updateSupervisionTask(option);
                      snoozeTaskToast(task, option);
                    }}
                  >
                    {option} days
                  </SnoozeMenuItem>
                );
              })}
          </>
        </SnoozeDropdownMenu>
      </Dropdown>
    </Wrapper>
  );
});
