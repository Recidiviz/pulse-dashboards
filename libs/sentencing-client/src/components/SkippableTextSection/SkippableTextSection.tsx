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
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { SkippableSection } from "../shared/SkippableSection";
import { SkippableTextArea } from "../shared/SkippableTextArea";

interface SkippableTextSectionProps {
  presenter: SARDetailsPresenter;
  title: string;
  fieldName: "victimImpactStatement" | "defendantStatement";
  placeholder: string;
}

export const SkippableTextSection: React.FC<SkippableTextSectionProps> =
  observer(function SkippableTextSection({
    presenter,
    title,
    fieldName,
    placeholder,
  }) {
    const value = presenter.SARData?.[fieldName] ?? null;

    // Get skip state based on field name
    const skipped =
      fieldName === "victimImpactStatement"
        ? presenter.victimImpactStatementSkipped
        : presenter.defendantStatementSkipped;

    // Create bound handler for this specific field
    const handleChange = async (value: string) => {
      if (fieldName === "victimImpactStatement") {
        await presenter.updateVictimImpactStatement(value);
      } else {
        await presenter.updateDefendantStatement(value);
      }
    };

    return (
      <SkippableSection
        title={title}
        skipped={skipped}
        onSkipChange={(skipped) =>
          presenter.updateFieldSkipped(fieldName, skipped)
        }
      >
        <SkippableTextArea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={skipped}
          height="28.125rem"
          onLocalChange={() => presenter.markFieldAsEditedLocally(fieldName)}
        />
      </SkippableSection>
    );
  });
