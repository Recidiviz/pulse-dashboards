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

import { Sans14, typography } from "@recidiviz/design-system";
import toast from "react-hot-toast";
import styled from "styled-components";

import { SupervisionTask, SupervisionTaskType } from "../../WorkflowsStore";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";

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

export const snoozeTaskToast = (
  task: SupervisionTask<SupervisionTaskType>,
  snoozeForDays: number,
  operationsInfoInToast: boolean,
  isMobile: boolean,
) => {
  const personName = task.person.displayName;
  let toastText = `${personName}'s ${task.displayName} will be hidden from this list for ${snoozeForDays} days.`;
  if (operationsInfoInToast)
    toastText += ` This will not change the officer's timeliness Operations metrics.`;
  return toast(
    (t) => (
      <ToastWrapper>
        <OpportunityStatusUpdateToast toastText={toastText} />
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
      duration: isMobile ? 4000 : 7000,
      style: { zIndex: 99999 },
    },
  );
};
