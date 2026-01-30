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

import { SARDetailsPresenter } from "../../../presenters/SARDetailsPresenter";
import { splitFullName } from "../../../utils/utils";
import { DomainCard } from "../DomainCard";
import * as Styled from "../HistoryCardStyles";
import { DrugHistory } from "./constants";
import { DrugHistoryItem } from "./DrugHistoryItem";
import { DrugHistoryModal } from "./DrugHistoryModal";

interface DrugHistoryCardProps {
  presenter: SARDetailsPresenter;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  title?: string;
}

export const DrugHistoryCard: React.FC<DrugHistoryCardProps> = observer(
  function DrugHistoryCard({ presenter, cardRef, title = "Substance Use" }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [initialData, setInitialData] = useState<DrugHistory | undefined>(
      undefined,
    );

    const { substanceAbuseLevel, drugHistorySummary, drugHistories } =
      presenter.SARData ?? {};

    // Get client's first name
    const { firstName: clientFirstName } = splitFullName(
      presenter.SARData?.client?.fullName,
    );

    const handleAdd = () => {
      setEditingIndex(null);
      setInitialData(undefined);
      setIsModalOpen(true);
    };

    const handleEdit = (index: number) => {
      if (drugHistories && drugHistories[index]) {
        setEditingIndex(index);
        setInitialData(drugHistories[index]);
        setIsModalOpen(true);
      }
    };

    const handleModalSave = async (data: DrugHistory) => {
      if (editingIndex !== null) {
        // Edit mode
        await presenter.updateDrugHistoryAtIndex(editingIndex, data);
      } else {
        // Add mode
        await presenter.addDrugHistory(data);
      }
    };

    const handleDelete = async (index: number) => {
      await presenter.deleteDrugHistory(index);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingIndex(null);
      setInitialData(undefined);
    };

    return (
      <>
        <DomainCard
          title={title}
          riskScore={substanceAbuseLevel ?? 0}
          summaryValue={drugHistorySummary ?? null}
          onSummaryChange={(value) => presenter.updateDrugHistorySummary(value)}
          cardRef={cardRef}
        >
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
                  {drugHistories.map((history, index) => {
                    // Create a stable key using index and unique data from the record
                    // Index is used since our CRUD operations are index-based
                    const key = `${index}-${history.substance || "none"}-${history.ageOfRegularUse || "none"}`;
                    return (
                      <DrugHistoryItem
                        key={key}
                        history={history}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </Styled.HistoryList>
              </Styled.HistoryTable>
            ) : (
              <Styled.EmptyState>
                No substance use records. Click &quot;+ Add&quot; to create one.
              </Styled.EmptyState>
            )}

            <Styled.AddButton onClick={handleAdd}>+ Add</Styled.AddButton>
          </Styled.HistorySection>
        </DomainCard>

        <DrugHistoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={initialData}
          editIndex={editingIndex ?? undefined}
          clientFirstName={clientFirstName}
        />
      </>
    );
  },
);
