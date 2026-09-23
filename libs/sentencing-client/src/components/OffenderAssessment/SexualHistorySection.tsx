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

import { clamp } from "lodash";
import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { STATIC_99R_NOTE_LABEL } from "../constants";
import { SkippableTextArea } from "../shared/SkippableTextArea/SkippableTextArea";
import { useStore } from "../StoreProvider/StoreProvider";
import { CheckboxRevealSection } from "./CheckboxRevealSection";
import * as DomainCardStyled from "./DomainCard.styles";
import { Input } from "./FormComponents.styles";
import * as Styled from "./OffenderAssessment.styles";
import { Static99RReportText } from "./Static99RReportText";
interface SexualHistorySectionProps {
  presenter: SARDetailsPresenter;
  disabled?: boolean;
}

/**
 * "This case involves a sex offense" checkbox, revealing a Sexual History
 * summary and a nested "A Static-99R was completed" checkbox that reveals a
 * report note built dynamically from the client's name, gender, and
 * Static-99R score (see `Static99RReportText`).
 */
export const SexualHistorySection: React.FC<SexualHistorySectionProps> =
  observer(function SexualHistorySection({ presenter, disabled = false }) {
    const { activeFeatureVariants } = useStore();

    if (!activeFeatureVariants["SARSexualHistory"]) return null;

    const {
      involvesSexCrime,
      sexualHistorySummary,
      static99RCompleted,
      static99RScore,
    } = presenter.SARData ?? {};
    return (
      <CheckboxRevealSection
        label="This case involves a sex offense"
        checked={involvesSexCrime ?? false}
        onChange={(value) => presenter.updateInvolvesSexCrime(value)}
        disabled={disabled}
      >
        <DomainCardStyled.SummaryLabel>
          Sexual History
        </DomainCardStyled.SummaryLabel>
        <SkippableTextArea
          value={sexualHistorySummary ?? null}
          onChange={(value) => presenter.updateSexualHistorySummary(value)}
          placeholder="Please enter a summary of sexual history"
          height="6.8125rem"
          disabled={disabled}
        />
        <CheckboxRevealSection
          label="A Static-99R was completed for this case"
          checked={static99RCompleted ?? false}
          onChange={(value) => presenter.updateStatic99RCompleted(value)}
          disabled={disabled}
        >
          <DomainCardStyled.SpacedRow>
            <Styled.ContentColumn>
              <DomainCardStyled.Title>
                Static 99 Total Score
              </DomainCardStyled.Title>
              <DomainCardStyled.HelperText>
                Valid Range -3 to 12
              </DomainCardStyled.HelperText>
            </Styled.ContentColumn>
            <DomainCardStyled.DomainRow>
              <Input
                $shrink
                type="number"
                value={static99RScore ?? ""}
                onChange={(e) => {
                  const raw = e.target.value ? Number(e.target.value) : null;
                  // A lone "-" (typing toward a negative score) parses as
                  // NaN; skip the update.
                  if (raw !== null && Number.isNaN(raw)) return;
                  const clamped = raw !== null ? clamp(raw, -3, 12) : null;
                  presenter.updateStatic99RScore(clamped);
                }}
              />
              <DomainCardStyled.ORASDomainText>
                / 12
              </DomainCardStyled.ORASDomainText>
            </DomainCardStyled.DomainRow>
          </DomainCardStyled.SpacedRow>
          <Styled.ContentColumn>
            <Styled.StaticNoteLabel>
              {STATIC_99R_NOTE_LABEL}
            </Styled.StaticNoteLabel>
            <Styled.StaticNoteBody>
              <Static99RReportText
                offenderName={presenter.formattedClientName}
                gender={presenter.SARData?.client?.gender}
                score={static99RScore ?? null}
              />
            </Styled.StaticNoteBody>
          </Styled.ContentColumn>
        </CheckboxRevealSection>
      </CheckboxRevealSection>
    );
  });
