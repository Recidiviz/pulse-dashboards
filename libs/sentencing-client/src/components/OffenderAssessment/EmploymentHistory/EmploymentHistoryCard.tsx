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
import { EmploymentHistory } from "./constants";
import { EmploymentHistoryItem } from "./EmploymentHistoryItem";
import { EmploymentHistoryModal } from "./EmploymentHistoryModal";

interface EmploymentHistoryCardProps {
  presenter: OffenderAssessmentPresenter;
}

export const EmploymentHistoryCard: React.FC<EmploymentHistoryCardProps> =
  observer(function EmploymentHistoryCard({ presenter }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<
      EmploymentHistory | undefined
    >(undefined);

    const { employmentHistories } = presenter;

    const handleAdd = () => {
      setEditingId(null);
      setInitialData(undefined);
      setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
      const history = employmentHistories.find((h) => h.id === id);
      if (history) {
        setEditingId(id);
        setInitialData(history);
        setIsModalOpen(true);
      }
    };

    const handleModalSave = async (data: Omit<EmploymentHistory, "id">) => {
      if (editingId) {
        // Edit mode
        await presenter.updateEmploymentHistory(editingId, data);
      } else {
        // Add mode
        await presenter.createEmploymentHistory(data);
      }
    };

    const handleDelete = async (id: string) => {
      await presenter.deleteEmploymentHistory(id);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setInitialData(undefined);
    };

    return (
      <>
        <Styled.HistorySection>
          <Styled.SectionTitle>Employment History</Styled.SectionTitle>

          {employmentHistories && employmentHistories.length > 0 ? (
            <Styled.HistoryTable>
              <Styled.TableHeaderRow>
                <Styled.TableHeaderCell>
                  Name of Employer
                </Styled.TableHeaderCell>
                <Styled.TableHeaderCell>Start/End Date</Styled.TableHeaderCell>
                <Styled.TableHeaderCell>
                  Verified by Report Author
                </Styled.TableHeaderCell>
              </Styled.TableHeaderRow>
              <Styled.HistoryList>
                {employmentHistories.map((history) => (
                  <EmploymentHistoryItem
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
              No employment records. Click &quot;+ Add&quot; to create one.
            </Styled.EmptyState>
          )}

          <Styled.AddButton onClick={handleAdd}>+ Add</Styled.AddButton>
        </Styled.HistorySection>

        <EmploymentHistoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={initialData}
          isEditMode={editingId !== null}
        />
      </>
    );
  });
