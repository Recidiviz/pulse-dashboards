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

import { Sans16 } from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { Button, palette } from "~design-system";

import { CharacterCountTextField } from "../../components/CharacterCountTextField/CharacterCountTextField";

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 1600;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(16)};
  width: 100%;
  padding: ${rem(16)};
`;

const FormTitle = styled(Sans16)`
  color: ${palette.pine1};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${rem(16)};
`;

const FormButton = styled(Button).attrs({ shape: "block" })`
  height: ${rem(40)};
  width: ${rem(117)};
  padding: ${rem(12)} ${rem(16)};
`;

type TaskSnoozeReasonFormProps = {
  /**
   * Called with the entered reason (or `undefined` if the user left the field
   * empty). The parent is responsible for persisting the snooze and any
   * subsequent toast / state cleanup.
   */
  onSave: (reason: string | undefined) => void;
  onCancel: () => void;
};

export function TaskSnoozeReasonForm({
  onSave,
  onCancel,
}: TaskSnoozeReasonFormProps) {
  const [reason, setReason] = useState("");
  // Validity is gated on the same length the counter shows the user — no trim
  // here, so the two stay aligned. Reason is optional: empty input is allowed;
  // if anything is typed it must meet the 3-character minimum.
  const canSave =
    reason.length === 0 ||
    (reason.length >= REASON_MIN_LENGTH && reason.length <= REASON_MAX_LENGTH);

  const handleSave = () => {
    if (!canSave) return;
    onSave(reason.length === 0 ? undefined : reason);
  };

  return (
    <FormWrapper
      className="TaskSnoozeReasonForm"
      data-testid="TaskSnoozeReasonForm"
    >
      <FormTitle>Why is this task not actionable? (optional)</FormTitle>
      <CharacterCountTextField
        id="task-snooze-reason"
        value={reason}
        onChange={setReason}
        minLength={REASON_MIN_LENGTH}
        maxLength={REASON_MAX_LENGTH}
        placeholder="Please specify a reason..."
        isOptional
      />
      <ButtonRow>
        <FormButton kind="secondary" onClick={onCancel}>
          Cancel
        </FormButton>
        <FormButton kind="primary" disabled={!canSave} onClick={handleSave}>
          Save
        </FormButton>
      </ButtonRow>
    </FormWrapper>
  );
}
