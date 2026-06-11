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

import { PriorTreatmentHistoryPresenter } from "../../../presenters/PriorTreatmentHistoryPresenter";
import * as Styled from "../HistoryCardStyles";
import { PriorTreatmentHistoryItem } from "./PriorTreatmentHistoryItem";
import { PriorTreatmentHistoryModal } from "./PriorTreatmentHistoryModal";
import { PriorTreatmentHistory } from "./types";

interface PriorTreatmentHistoryCardProps {
  presenter: PriorTreatmentHistoryPresenter;
  disabled?: boolean;
}

export const PriorTreatmentHistoryCard: React.FC<PriorTreatmentHistoryCardProps> =
  observer(function PriorTreatmentHistoryCard({ presenter, disabled = false }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<
      PriorTreatmentHistory | undefined
    >(undefined);

    const { priorTreatmentHistories } = presenter;

    const handleAdd = () => {
      setEditingId(null);
      setInitialData(undefined);
      setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
      const history = priorTreatmentHistories.find((h) => h.id === id);
      if (history) {
        setEditingId(id);
        setInitialData(history);
        setIsModalOpen(true);
      }
    };

    const handleModalSave = async (data: Omit<PriorTreatmentHistory, "id">) => {
      if (editingId) {
        // Edit mode
        await presenter.updatePriorTreatmentHistory(editingId, data);
      } else {
        // Add mode
        await presenter.createPriorTreatmentHistory(data);
      }
    };

    const handleDelete = async (id: string) => {
      await presenter.deletePriorTreatmentHistory(id);
    };

    const handleUndo = async (data: Omit<PriorTreatmentHistory, "id">) => {
      await presenter.createPriorTreatmentHistory(data);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setInitialData(undefined);
    };

    return (
      <>
        <Styled.HistorySection>
          {priorTreatmentHistories && priorTreatmentHistories.length > 0 ? (
            <Styled.HistoryTable>
              <Styled.TableHeaderRow>
                <Styled.TableHeaderCell>Year Completed</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>Program</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>
                  Verified by Report Author
                </Styled.TableHeaderCell>
              </Styled.TableHeaderRow>
              <Styled.HistoryList>
                {priorTreatmentHistories.map((history) => (
                  <PriorTreatmentHistoryItem
                    key={history.id}
                    history={history}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUndo={handleUndo}
                    disabled={disabled}
                  />
                ))}
              </Styled.HistoryList>
            </Styled.HistoryTable>
          ) : (
            <Styled.EmptyState>No history added</Styled.EmptyState>
          )}

          {!disabled && (
            <Styled.AddButton
              onClick={handleAdd}
              aria-label="Add prior treatment history"
            >
              + Add
            </Styled.AddButton>
          )}
        </Styled.HistorySection>

        <PriorTreatmentHistoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={initialData}
          isEditMode={editingId !== null}
        />
      </>
    );
  });
