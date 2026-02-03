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

import { DeleteConfirmation } from "../DeleteConfirmation";
import * as Styled from "../HistoryItemStyles";
import {
  DrugHistory,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
  SubstanceTypeLabels,
} from "./constants";

interface DrugHistoryItemProps {
  history: DrugHistory;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export const DrugHistoryItem: React.FC<DrugHistoryItemProps> = ({
  history,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(history.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <DeleteConfirmation
        message="Are you sure you want to delete this substance use record?"
        onCancel={() => setShowDeleteConfirm(false)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    );
  }

  return (
    <Styled.Card>
      <Styled.IconRow>
        <Styled.EditButton
          onClick={() => onEdit(history.id)}
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

      <Styled.DataRow>
        <Styled.DataCell>
          {history.substance
            ? SubstanceTypeLabels[history.substance]
            : "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {history.ageOfRegularUse ?? "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {history.lastUse
            ? new Date(history.lastUse).toLocaleDateString("en-US", {
                timeZone: "UTC",
              })
            : "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {history.heaviestUse
            ? FrequencyOfUseLabels[history.heaviestUse]
            : "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {history.method ? MethodOfUseLabels[history.method] : "Not specified"}
        </Styled.DataCell>
      </Styled.DataRow>
    </Styled.Card>
  );
};
