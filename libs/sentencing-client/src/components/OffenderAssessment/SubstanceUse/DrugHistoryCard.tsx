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

import { observer } from "mobx-react-lite";
import React, { useState } from "react";

import { OffenderAssessmentPresenter } from "../../../presenters/OffenderAssessmentPresenter";
import * as Styled from "../HistoryCardStyles";
import { DrugHistory } from "./constants";
import { DrugHistoryItem } from "./DrugHistoryItem";
import { DrugHistoryModal } from "./DrugHistoryModal";

interface DrugHistoryCardProps {
  presenter: OffenderAssessmentPresenter;
}

export const DrugHistoryCard: React.FC<DrugHistoryCardProps> = observer(
  function DrugHistoryCard({ presenter }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<DrugHistory | undefined>(
      undefined,
    );

    const { drugHistories, clientFirstName } = presenter;

    const handleAdd = () => {
      setEditingId(null);
      setInitialData(undefined);
      setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
      const history = drugHistories.find((h) => h.id === id);
      if (history) {
        setEditingId(id);
        setInitialData(history);
        setIsModalOpen(true);
      }
    };

    const handleModalSave = async (data: Omit<DrugHistory, "id">) => {
      if (editingId) {
        // Edit mode
        await presenter.updateDrugHistory(editingId, data);
      } else {
        // Add mode
        await presenter.createDrugHistory(data);
      }
    };

    const handleDelete = async (id: string) => {
      await presenter.deleteDrugHistory(id);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setInitialData(undefined);
    };

    return (
      <>
        <Styled.HistorySection>
          <Styled.SectionTitle>Substance Use History</Styled.SectionTitle>

          {drugHistories && drugHistories.length > 0 ? (
            <Styled.HistoryTable>
              <Styled.TableHeaderRow>
                <Styled.TableHeaderCell>Substance</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>
                  Age of Regular Use
                </Styled.TableHeaderCell>
                <Styled.TableHeaderCell>Last Use</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>Heaviest Use</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>Method</Styled.TableHeaderCell>
              </Styled.TableHeaderRow>
              <Styled.HistoryList>
                {drugHistories.map((history) => (
                  <DrugHistoryItem
                    key={history.id}
                    history={history}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </Styled.HistoryList>
            </Styled.HistoryTable>
          ) : (
            <Styled.EmptyState>
              No substance use records. Click &quot;+ Add&quot; to create one.
            </Styled.EmptyState>
          )}

          <Styled.AddButton onClick={handleAdd}>+ Add</Styled.AddButton>
        </Styled.HistorySection>

        <DrugHistoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={initialData}
          isEditMode={editingId !== null}
          clientFirstName={clientFirstName}
        />
      </>
    );
  },
);
