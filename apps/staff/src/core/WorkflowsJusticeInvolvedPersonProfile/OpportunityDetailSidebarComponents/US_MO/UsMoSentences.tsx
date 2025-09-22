// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import React from "react";

import { usMoFormatSentenceLength } from "~datatypes";

import {
  DetailsContent,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

const UsMoSentences: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;

  return (
    <DetailsSection>
      <DetailsHeading>Current Cycle Sentences</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {metadata.latestCycleSentences.map((sentence) => (
            <React.Fragment
              key={`${sentence.offense}-${sentence.sentenceLengthYears}-${sentence.sentenceLengthMonths}-${sentence.sentenceLengthDays}`}
            >
              <DetailsSubheading>{sentence.offense}</DetailsSubheading>
              <DetailsContent>
                {usMoFormatSentenceLength(sentence)}
              </DetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsMoSentences;
