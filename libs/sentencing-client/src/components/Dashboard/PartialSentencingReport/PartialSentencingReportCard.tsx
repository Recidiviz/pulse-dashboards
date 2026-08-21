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
import toast from "react-hot-toast";

import { palette } from "~design-system";

import { ERROR_TOAST_DURATION } from "../../../datastores/constants";
import {
  InvestigationType,
  SARDetailsPresenter,
} from "../../../presenters/SARDetailsPresenter";
import * as Styled from "./PartialSentencingReportCard.styles";

interface ReportTypeOption {
  key: string;
  label: string;
  investigationType: InvestigationType;
  isVictimImpactOnly: boolean;
}

const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    key: "victimImpactOnly",
    label: "I am responsible for Victim Impact only",
    investigationType: "PSR",
    isVictimImpactOnly: true,
  },
  {
    key: "noVictimImpact",
    label: "I am responsible for all sections except Victim Impact",
    investigationType: "PSR",
    isVictimImpactOnly: false,
  },
  {
    key: "SAR",
    label: "I am responsible for all sections of this SAR",
    investigationType: "SAR",
    isVictimImpactOnly: false,
  },
];

interface PartialSentencingReportCardProps {
  presenter: SARDetailsPresenter;
  onBackToDashboard: () => void;
}

export const PartialSentencingReportCard: React.FC<PartialSentencingReportCardProps> =
  observer(function PartialSentencingReportCard({
    presenter,
    onBackToDashboard,
  }) {
    // Kept as local draft state (not written to the presenter) until Save is
    // clicked, so that: (1) a failed save can be rolled back to the real
    // previous value, and (2) selecting an option doesn't immediately flip
    // presenter.showReportTypeCard's underlying condition and hide the card.
    const [draftInvestigationType, setDraftInvestigationType] =
      React.useState<InvestigationType>(presenter.investigationType ?? "PSR");
    const [draftIsVictimImpactOnly, setDraftIsVictimImpactOnly] =
      React.useState(presenter.isVictimImpactOnly);

    return (
      <Styled.Container>
        <Styled.TitleContainer>
          <Styled.Title>
            Which sections of this SAR are you responsible for?
          </Styled.Title>
          <Styled.Subtitle>You can change this later.</Styled.Subtitle>
        </Styled.TitleContainer>
        <Styled.OptionList>
          {REPORT_TYPE_OPTIONS.map((option) => (
            <Styled.OptionContainer key={option.key}>
              <Styled.RadioInput
                type="radio"
                name="reportSection"
                value={option.key}
                checked={
                  draftInvestigationType === option.investigationType &&
                  draftIsVictimImpactOnly === option.isVictimImpactOnly
                }
                onChange={() => {
                  setDraftInvestigationType(option.investigationType);
                  setDraftIsVictimImpactOnly(option.isVictimImpactOnly);
                }}
              />
              <Styled.OptionTextContainer>
                <Styled.OptionTitle>{option.label}</Styled.OptionTitle>
              </Styled.OptionTextContainer>
            </Styled.OptionContainer>
          ))}
        </Styled.OptionList>
        <Styled.ButtonRow>
          <Styled.Button onClick={onBackToDashboard}>Back</Styled.Button>
          <Styled.SaveButton
            disabled={draftIsVictimImpactOnly === null}
            onClick={async () => {
              try {
                await presenter.updateInvestigation(
                  draftInvestigationType,
                  draftIsVictimImpactOnly,
                );
              } catch {
                toast("Failed to save. Please try again.", {
                  duration: ERROR_TOAST_DURATION,
                  style: { backgroundColor: palette.signal.error },
                });
              }
            }}
          >
            Save
          </Styled.SaveButton>
        </Styled.ButtonRow>
      </Styled.Container>
    );
  });
