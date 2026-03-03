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
import toast from "react-hot-toast";

import { Icon, IconSVG } from "~design-system";

import * as Styled from "../HistoryItemStyles";
import {
  DrugHistory,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
  SubstanceTypeLabels,
} from "./constants";

const getSubstanceLabel = (history: DrugHistory): string => {
  if (!history.substance) return "Not specified";
  if (history.substance === "Other" && history.otherSubstanceName)
    return history.otherSubstanceName;
  return SubstanceTypeLabels[history.substance];
};

interface DrugHistoryItemProps {
  history: DrugHistory;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUndo: (data: Omit<DrugHistory, "id">) => Promise<void>;
}

export const DrugHistoryItem: React.FC<DrugHistoryItemProps> = ({
  history,
  onEdit,
  onDelete,
  onUndo,
}) => {
  const handleDelete = async () => {
    const { id, ...savedData } = history;
    try {
      await onDelete(id);
    } catch {
      toast.error("Failed to delete. Please try again.");
      return;
    }
    toast(
      (t) => (
        <Styled.UndoToastContent>
          <span>Substance use record deleted.</span>
          <Styled.UndoButton
            onClick={() => {
              void onUndo(savedData);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </Styled.UndoButton>
        </Styled.UndoToastContent>
      ),
      { duration: 7000 },
    );
  };

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
          onClick={() => void handleDelete()}
          aria-label="Delete substance use record"
        >
          <Icon kind={IconSVG["Minus"]} size={8} />
        </Styled.DeleteIconButton>
      </Styled.IconRow>

      <Styled.DataRow>
        <Styled.DataCell>{getSubstanceLabel(history)}</Styled.DataCell>
        <Styled.DataCell>
          {history.ageOfRegularUse ?? "Not specified"}
        </Styled.DataCell>
        <Styled.DataCell>
          {history.lastUse
            ? new Date(history.lastUse).toLocaleDateString("en-US", {
                timeZone: "UTC",
                month: "2-digit",
                year: "numeric",
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
