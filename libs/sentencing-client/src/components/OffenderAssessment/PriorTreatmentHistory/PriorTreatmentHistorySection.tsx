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
import React from "react";

import { PriorTreatmentHistoryPresenter } from "../../../presenters/PriorTreatmentHistoryPresenter";
import { PriorTreatmentSection } from "../../SARDetails/SARDetails.styles";
import { SkippableTextArea } from "../../shared/SkippableTextArea";
import { SectionTitle } from "../../shared/styles/SectionStyles";
import { PriorTreatmentHistoryCard } from "./PriorTreatmentHistoryCard";

interface PriorTreatmentHistorySectionProps {
  presenter: PriorTreatmentHistoryPresenter;
}

export const PriorTreatmentHistorySection: React.FC<PriorTreatmentHistorySectionProps> =
  observer(function PriorTreatmentHistorySection({ presenter }) {
    return (
      <PriorTreatmentSection>
        <SectionTitle>Prior Community Treatment History</SectionTitle>
        <PriorTreatmentHistoryCard presenter={presenter} />
        <SkippableTextArea
          label="Summary"
          value={presenter.SARData?.priorTreatmentHistorySummary ?? null}
          onChange={(value) =>
            presenter.updatePriorTreatmentHistorySummary(value)
          }
          placeholder="Please enter a summary of prior treatment history"
          height="6.8125rem"
        />
      </PriorTreatmentSection>
    );
  });
