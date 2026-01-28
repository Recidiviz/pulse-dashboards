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

import { formatBooleanDisplay, formatDateRange } from "../../../utils/utils";
import { DeleteConfirmation } from "../DeleteConfirmation";
import * as Styled from "../HistoryItemStyles";
import { EmploymentHistory } from "./constants";

interface EmploymentHistoryItemProps {
  history: EmploymentHistory;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export const EmploymentHistoryItem: React.FC<EmploymentHistoryItemProps> = ({
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
        message="Are you sure you want to delete this employment record?"
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
          aria-label="Edit employment record"
        >
          <Icon kind={IconSVG["Edit"]} size={16} />
        </Styled.EditButton>
        <Styled.DeleteIconButton
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="Delete employment record"
        >
          <Icon kind={IconSVG["Minus"]} size={8} />
        </Styled.DeleteIconButton>
      </Styled.IconRow>

      <Styled.DataRow>
        <Styled.DataCell>
          {history.employerName || "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {formatDateRange(history.startDate, history.endDate)}
        </Styled.DataCell>
        <Styled.DataCell>
          {formatBooleanDisplay(history.verifiedByReportAuthor)}
        </Styled.DataCell>
      </Styled.DataRow>
    </Styled.Card>
  );
};
