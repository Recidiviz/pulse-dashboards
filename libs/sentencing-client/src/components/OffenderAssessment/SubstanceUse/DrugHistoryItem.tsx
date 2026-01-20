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

import React, { useState } from "react";

import { Icon, IconSVG } from "~design-system";

import {
  ButtonRow,
  CancelButton,
  DeleteButton,
} from "../FormComponents.styles";
import {
  DrugHistory,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
  SubstanceTypeLabels,
} from "./constants";
import * as Styled from "./DrugHistoryItem.styles";

interface DrugHistoryItemProps {
  history: DrugHistory;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => Promise<void>;
}

export const DrugHistoryItem: React.FC<DrugHistoryItemProps> = ({
  history,
  index,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(index);
    } catch (error) {
      console.error("Failed to delete substance use record:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <Styled.Card>
        <Styled.DeleteConfirmation>
          <Styled.DeleteText>
            Are you sure you want to delete this substance use record?
          </Styled.DeleteText>
          <ButtonRow>
            <CancelButton
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </CancelButton>
            <DeleteButton onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </DeleteButton>
          </ButtonRow>
        </Styled.DeleteConfirmation>
      </Styled.Card>
    );
  }

  return (
    <Styled.Card>
      <Styled.IconRow>
        <Styled.EditButton
          onClick={() => onEdit(index)}
          aria-label="Edit substance use record"
        >
          <Icon kind={IconSVG["Edit"]} size={16} />
        </Styled.EditButton>
        <Styled.DeleteIconButton
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Delete substance use record"
        >
          <Icon kind={IconSVG["Minus"]} size={8} />
        </Styled.DeleteIconButton>
      </Styled.IconRow>

      <Styled.InfoRow>
        <Styled.InfoItem>
          <Styled.InfoLabel>Substance:</Styled.InfoLabel>
          <Styled.InfoValue>
            {history.substance
              ? SubstanceTypeLabels[history.substance]
              : "Not specified"}
          </Styled.InfoValue>
        </Styled.InfoItem>
        <Styled.InfoItem>
          <Styled.InfoLabel>Age of Regular Use:</Styled.InfoLabel>
          <Styled.InfoValue>
            {history.ageOfRegularUse ?? "Not specified"}
          </Styled.InfoValue>
        </Styled.InfoItem>
        <Styled.InfoItem>
          <Styled.InfoLabel>Last Use:</Styled.InfoLabel>
          <Styled.InfoValue>
            {history.lastUse
              ? new Date(history.lastUse).toLocaleDateString("en-US")
              : "Not specified"}
          </Styled.InfoValue>
        </Styled.InfoItem>
        <Styled.InfoItem>
          <Styled.InfoLabel>Heaviest Use:</Styled.InfoLabel>
          <Styled.InfoValue>
            {history.heaviestUse
              ? FrequencyOfUseLabels[history.heaviestUse]
              : "Not specified"}
          </Styled.InfoValue>
        </Styled.InfoItem>
        <Styled.InfoItem>
          <Styled.InfoLabel>Method:</Styled.InfoLabel>
          <Styled.InfoValue>
            {history.method
              ? MethodOfUseLabels[history.method]
              : "Not specified"}
          </Styled.InfoValue>
        </Styled.InfoItem>
      </Styled.InfoRow>
    </Styled.Card>
  );
};
