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

import React from "react";

import {
  isRequiredReleaseTaskDetailMissing,
  ORDERED_RELEASE_TASK_TYPES,
  RELEASE_TASK_DEFS,
} from "~@idaho-th/shared";

import InfoIcon from "../../../assets/information-circle.svg?react";
import { Checkbox } from "../../../common/inputs";
import { Tooltip } from "../../../common/Tooltip";
import { ReleaseTaskDate } from "./ReleaseTaskDate";
import {
  DETAIL_CONTENT,
  OWNER_ACTION_LABEL,
} from "./ReleaseTaskList.constants";
import * as Styled from "./ReleaseTaskList.styles";
import { ReleaseTaskNote } from "./ReleaseTaskNote";
import type {
  ReleaseTaskDetailConfig,
  ReleaseTaskDetailContent,
  ReleaseTaskListProps,
} from "./types";

const renderDetail = (
  detail: ReleaseTaskDetailConfig,
  content: ReleaseTaskDetailContent,
) => {
  const { ariaLabel, placeholder, emptyMessage, valueLabel } = content;

  return detail.type === "text" ? (
    <ReleaseTaskNote
      value={detail.value}
      editable={detail.editable}
      onChange={detail.onChange}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
    />
  ) : (
    <ReleaseTaskDate
      value={detail.value}
      editable={detail.editable}
      onChange={detail.onChange}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      valueLabel={valueLabel}
    />
  );
};

export const ReleaseTaskList: React.FC<ReleaseTaskListProps> = ({
  tasks,
  viewerRole,
  disabled,
  isToggling,
  onToggle,
  details,
}) => {
  const taskMap = new Map(tasks?.map((t) => [t.taskType, t]) ?? []);
  const completedCount = ORDERED_RELEASE_TASK_TYPES.filter(
    (taskType) => taskMap.get(taskType)?.completed,
  ).length;
  const totalCount = ORDERED_RELEASE_TASK_TYPES.length;

  return (
    <Styled.Root>
      <Styled.HeaderRow>
        <Styled.Title>Release Tasks</Styled.Title>
        <Styled.Count>
          {completedCount} of {totalCount} complete
        </Styled.Count>
      </Styled.HeaderRow>
      <Styled.Subtitle>
        {disabled
          ? "The client’s case is pending a probation/parole decision and home plan investigation. Once approvals have been made, you’ll be able to track the tasks below."
          : "These tasks can happen in any order."}
      </Styled.Subtitle>

      <Styled.TaskList $disabled={disabled}>
        {ORDERED_RELEASE_TASK_TYPES.map((taskType, index) => {
          const def = RELEASE_TASK_DEFS[taskType];
          const task = taskMap.get(taskType);
          const isChecked = task?.completed ?? false;
          const isOwnTask = def.ownerRole === viewerRole;
          const detail = details?.[taskType];
          const content = DETAIL_CONTENT[taskType];
          // Unchecking is always allowed; only completing needs the detail.
          const blockedByDetail =
            !isChecked && isRequiredReleaseTaskDetailMissing(taskType, task);
          const canToggleTask =
            !disabled && !isToggling && isOwnTask && !blockedByDetail;

          const checkbox = (
            <Checkbox
              checked={isChecked}
              disabled={!canToggleTask}
              onChange={() => onToggle(taskType)}
              aria-label={def.label}
              size={18}
            />
          );

          return (
            <React.Fragment key={taskType}>
              {index > 0 && <Styled.TaskSeparator />}
              <Styled.TaskItem>
                {blockedByDetail && content ? (
                  <Tooltip content={content.requiredHint}>{checkbox}</Tooltip>
                ) : (
                  checkbox
                )}
                <Styled.TaskLabelRow>
                  <Styled.TaskLabel $checked={isChecked}>
                    {def.label}
                  </Styled.TaskLabel>
                  <Tooltip content={def.tooltip}>
                    <InfoIcon />
                  </Tooltip>
                </Styled.TaskLabelRow>
                <Styled.OwnerBadge $own={isOwnTask}>
                  <Styled.OwnerBadgeText $own={isOwnTask}>
                    {isOwnTask
                      ? "Your action"
                      : OWNER_ACTION_LABEL[def.ownerRole]}
                  </Styled.OwnerBadgeText>
                </Styled.OwnerBadge>
              </Styled.TaskItem>

              {detail && content && renderDetail(detail, content)}
            </React.Fragment>
          );
        })}
      </Styled.TaskList>
    </Styled.Root>
  );
};
