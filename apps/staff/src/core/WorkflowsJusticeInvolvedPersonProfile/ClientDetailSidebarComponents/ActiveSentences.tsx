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

import React from "react";

import { formatWorkflowsDate, toTitleCase } from "../../../utils";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../styles";
import { ClientProfileProps } from "../types";

export const ActiveSentences: React.FC<ClientProfileProps> = ({ client }) => {
  const { activeSentences } = client.record;
  if (!activeSentences) return null;

  return (
    <DetailsSection>
      <DetailsHeading>Active Sentences</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {activeSentences.map((sentence) => (
            <SecureDetailsContent key={sentence.sentenceId}>
              <DetailsList>
                <DetailsSubheading>Offense Type</DetailsSubheading>
                <SecureDetailsContent>
                  {toTitleCase(sentence.offenseType)}
                </SecureDetailsContent>
                <DetailsSubheading>Date Imposed</DetailsSubheading>
                <SecureDetailsContent>
                  {formatWorkflowsDate(sentence.dateImposed)}
                </SecureDetailsContent>
                <DetailsSubheading>County</DetailsSubheading>
                <SecureDetailsContent>
                  {toTitleCase(sentence.countyCode)}
                </SecureDetailsContent>
                <DetailsSubheading>Sex Offense</DetailsSubheading>
                <SecureDetailsContent>
                  {sentence.isSexOffense ? "Yes" : "No"}
                </SecureDetailsContent>
              </DetailsList>
            </SecureDetailsContent>
          ))}
          {activeSentences.length === 0 && (
            <DetailsSubheading>No active sentences.</DetailsSubheading>
          )}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default ActiveSentences;
