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

import React, { useEffect } from "react";

import { Offenses } from "../../../../src/api";
import ExternalLinkIcon from "../../assets/external-link-icon.svg?react";
import InfoIcon from "../../assets/info-icon.svg?react";
import * as Styled from "../CaseDetails.styles";

type MandatoryMinimumsProps = {
  mandatoryMinimums?: Offenses[number]["mandatoryMinimums"];
  hasMandatoryMinimumFVEnabled?: boolean;
  mandatoryMinimumAutoSelectionRecommendation?: string;
  handleRecommendationUpdate: (recommendation: string) => void;
};

const MandatoryMinimums: React.FC<MandatoryMinimumsProps> = ({
  mandatoryMinimums,
  hasMandatoryMinimumFVEnabled,
  mandatoryMinimumAutoSelectionRecommendation,
  handleRecommendationUpdate,
}) => {
  useEffect(() => {
    if (
      hasMandatoryMinimumFVEnabled &&
      mandatoryMinimumAutoSelectionRecommendation
    ) {
      handleRecommendationUpdate(mandatoryMinimumAutoSelectionRecommendation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasMandatoryMinimumFVEnabled,
    mandatoryMinimumAutoSelectionRecommendation,
  ]);

  if (!hasMandatoryMinimumFVEnabled || !mandatoryMinimums?.length) {
    return null;
  }

  return (
    <Styled.InputAlert>
      {mandatoryMinimums.map((mm) => (
        <Styled.InputAlertMessageWrapper key={mm.sentenceType}>
          <span>
            <InfoIcon />
            This offense carries a mandatory minimum{" "}
            {mm.sentenceType.toLocaleLowerCase()} sentence of{" "}
            {mm.minimumSentenceLength} years.
          </span>
          {mm.statuteLink && mm.statuteNumber && (
            <span>
              <Styled.Link href={mm.statuteLink} target="_blank">
                <ExternalLinkIcon />
                View statute {mm.statuteNumber}
              </Styled.Link>
            </span>
          )}
        </Styled.InputAlertMessageWrapper>
      ))}
    </Styled.InputAlert>
  );
};

export default MandatoryMinimums;
