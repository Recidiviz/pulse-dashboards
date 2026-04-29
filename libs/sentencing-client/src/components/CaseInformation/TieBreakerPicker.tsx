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

import { MostSevereCharge } from "~@sentencing/trpc-types";

import { Divider } from "./OffenseCard.styles";
import * as Styled from "./TieBreakerPicker.styles";

interface TieBreakerPickerProps {
  candidates: MostSevereCharge[];
  selectedOffenseName: string | null | undefined;
  onSelect: (offenseName: string) => void;
}

export const TieBreakerPicker: React.FC<TieBreakerPickerProps> = observer(
  function TieBreakerPicker({ candidates, selectedOffenseName, onSelect }) {
    return (
      <>
        <Divider />
        <Styled.Container>
          <Styled.Title>Which offense is most severe?</Styled.Title>
          <Styled.Subtitle>
            We couldn&apos;t determine severity automatically. Select the
            driving offense below.
          </Styled.Subtitle>
          <Styled.OptionList>
            {candidates.map((candidate) => (
              <Styled.OptionLabel key={candidate.offenseName}>
                <Styled.RadioInput
                  type="radio"
                  name="mostSevereOffense"
                  value={candidate.offenseName}
                  checked={selectedOffenseName === candidate.offenseName}
                  onChange={() => onSelect(candidate.offenseName)}
                />
                <Styled.OptionText>
                  <span>Offense: {candidate.offenseName}</span>
                  <span>Class: {candidate.offenseClass ?? "—"}</span>
                </Styled.OptionText>
              </Styled.OptionLabel>
            ))}
          </Styled.OptionList>
        </Styled.Container>
      </>
    );
  },
);
