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

import { Case } from "../../../api";
import NeedsIcon from "../../assets/magnifying-glass-black-icon.svg?react";
import ProtectiveFactorsIcon from "../../assets/protective-factors-icon.svg?react";
import * as Styled from "../CaseDetails.styles";
import {
  parseNeedsToBeAddressedValue,
  parseProtectiveFactorsValue,
} from "../Form/utils";
import { filterOtherOption } from "../utils";

interface FactorsAndNeedsProps {
  protectiveFactors?: Case["protectiveFactors"] | null;
  needs?: Case["needsToBeAddressed"] | null;
}

const FactorsAndNeeds: React.FC<FactorsAndNeedsProps> = ({
  protectiveFactors,
  needs,
}) => {
  const protectiveFactorsList = filterOtherOption(
    parseProtectiveFactorsValue(protectiveFactors) ?? [],
  );
  const needsList = filterOtherOption(
    parseNeedsToBeAddressedValue(needs) ?? [],
  );

  if (!protectiveFactorsList?.length && !needsList?.length) {
    return null;
  }

  return (
    <Styled.ModuleContainer>
      <Styled.Title>Factors and Needs</Styled.Title>
      <Styled.ModuleSection>
        <Styled.FactorsNeedsContainer>
          {/* Mitigating Risk Factors */}
          {protectiveFactorsList && protectiveFactorsList.length > 0 && (
            <Styled.FactorsNeedsWrapper>
              <Styled.FactorsNeedsTitle>
                <ProtectiveFactorsIcon /> Mitigating Risk Factors
              </Styled.FactorsNeedsTitle>
              <Styled.FactorsNeedsList>
                {protectiveFactorsList.map((factor) => (
                  <Styled.FactorsNeedsListItem>
                    {factor}
                  </Styled.FactorsNeedsListItem>
                ))}
              </Styled.FactorsNeedsList>
            </Styled.FactorsNeedsWrapper>
          )}

          {/* Areas of Need */}
          {needsList && needsList.length > 0 && (
            <Styled.FactorsNeedsWrapper>
              <Styled.FactorsNeedsTitle>
                <NeedsIcon /> Areas of Need
              </Styled.FactorsNeedsTitle>
              <Styled.FactorsNeedsList>
                {needsList.map((need) => (
                  <Styled.FactorsNeedsListItem>
                    {need}
                  </Styled.FactorsNeedsListItem>
                ))}
              </Styled.FactorsNeedsList>
            </Styled.FactorsNeedsWrapper>
          )}
        </Styled.FactorsNeedsContainer>
      </Styled.ModuleSection>
    </Styled.ModuleContainer>
  );
};

export default observer(FactorsAndNeeds);
