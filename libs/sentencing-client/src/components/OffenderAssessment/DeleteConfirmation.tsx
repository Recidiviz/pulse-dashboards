// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ButtonRow, CancelButton, DeleteButton } from "./FormComponents.styles";
import * as Styled from "./HistoryItemStyles";

interface DeleteConfirmationProps {
  message: string;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

/**
 * Reusable delete confirmation UI for history items.
 * Displays a confirmation message with Cancel and Delete buttons.
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  message,
  onCancel,
  onDelete,
  isDeleting,
}) => {
  return (
    <Styled.Card>
      <Styled.DeleteConfirmation>
        <Styled.DeleteText>{message}</Styled.DeleteText>
        <ButtonRow>
          <CancelButton onClick={onCancel} disabled={isDeleting}>
            Cancel
          </CancelButton>
          <DeleteButton onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </DeleteButton>
        </ButtonRow>
      </Styled.DeleteConfirmation>
    </Styled.Card>
  );
};
