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

import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { AttentionFrame } from "~@idaho-th/client/components/common/AttentionFrame";
import { useHousingApplicationsStore } from "~@idaho-th/client/datastores/IdahoTHStoreContext";
import {
  useToggleStaffHomePlanReleaseTask,
  useUpdateHomePlanReleaseTaskDetail,
} from "~@idaho-th/client/hooks/housingApplication";
import { useStaffApplicationById } from "~@idaho-th/client/hooks/useApplicationDetail";
import type { StaffHomePlan } from "~@idaho-th/client/interfaces/common";
import {
  APPLICATION_STAGE,
  ReleaseTaskOwnerRole,
  ReleaseTaskType,
} from "~@idaho-th/shared";

import type { ReleaseTaskDetailsOptions } from "../../common/ReleaseTaskList";
import {
  buildReleaseTaskDetails,
  ReleaseTaskList,
} from "../../common/ReleaseTaskList";
import { UpdateReleaseDateModal } from "../../UpdateReleaseDateModal";

interface ReleaseTasksProps {
  homePlanData: StaffHomePlan | undefined;
}

export const ReleaseTasks = observer(function ReleaseTasks({
  homePlanData,
}: ReleaseTasksProps) {
  const { currentApplicationId } = useHousingApplicationsStore();
  const { data: currentApplication } = useStaffApplicationById(
    currentApplicationId,
    !!currentApplicationId,
  );

  const { mutate: toggleReleaseTask, isPending: isToggling } =
    useToggleStaffHomePlanReleaseTask();
  const { mutate: updateReleaseTaskDetail } =
    useUpdateHomePlanReleaseTaskDetail();
  const [isReleaseDateModalOpen, setIsReleaseDateModalOpen] = useState(false);

  const tasks = homePlanData?.releaseTasks?.tasks ?? null;
  const canToggle = homePlanData?.permissions.canToggleReleaseTasks ?? false;

  const handleDetailChange: NonNullable<
    ReleaseTaskDetailsOptions["onChange"]
  > = (taskType, detail) => {
    if (!currentApplicationId) return;
    updateReleaseTaskDetail({
      applicationId: currentApplicationId,
      taskType,
      ...detail,
    });
  };

  const details = buildReleaseTaskDetails(tasks, {
    viewerRole: ReleaseTaskOwnerRole.STAFF,
    canToggle,
    onChange: handleDetailChange,
  });

  const handleToggle = (taskType: ReleaseTaskType) => {
    if (!currentApplicationId) return;
    const task = tasks?.find((t) => t.taskType === taskType);
    const isChecking = !(task?.completed ?? false);
    toggleReleaseTask(
      {
        applicationId: currentApplicationId,
        taskType: taskType as never,
        completed: isChecking,
      },
      {
        onSuccess: () => {
          if (
            taskType === ReleaseTaskType.HOUSING_DATE_PROVIDED &&
            isChecking
          ) {
            setIsReleaseDateModalOpen(true);
          }
        },
        onError: () => toast.error("Failed to update release task."),
      },
    );
  };

  const isClosed = currentApplication?.stage === APPLICATION_STAGE.CLOSED;
  const isReleaseStage =
    currentApplication?.stage === APPLICATION_STAGE.RELEASE;
  const isCurrentStep = !isClosed && isReleaseStage;

  return (
    <>
      <AttentionFrame active={isCurrentStep && canToggle} hideFrame={isClosed}>
        <ReleaseTaskList
          tasks={tasks}
          viewerRole={ReleaseTaskOwnerRole.STAFF}
          disabled={!canToggle}
          isToggling={isToggling}
          onToggle={handleToggle}
          details={details}
        />
      </AttentionFrame>

      <UpdateReleaseDateModal
        isOpen={isReleaseDateModalOpen}
        onClose={() => setIsReleaseDateModalOpen(false)}
        applicationId={currentApplicationId}
        currentDate={currentApplication?.expectedReleaseDate ?? null}
        prefillDate={false}
      />
    </>
  );
});
