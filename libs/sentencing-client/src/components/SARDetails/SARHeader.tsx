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
import moment from "moment";
import React from "react";

import { SARAttributes } from "../../datastores/types";
import * as Styled from "./SARHeader.styles";
import { useOverflowText } from "./useOverflowText";

type SARHeaderProps = {
  SARAttributes: SARAttributes;
  onBackToDashboard: () => void;
  formattedGender: string | undefined;
  offenseNames: string[];
};

export const SARHeader: React.FC<SARHeaderProps> = observer(function SARHeader({
  SARAttributes,
  onBackToDashboard,
  formattedGender,
  offenseNames,
}) {
  const { client, externalId, dueDate, age } = SARAttributes;
  const { fullName } = client || {};

  const { containerRef: offenseRef, displayText: offenseText } =
    useOverflowText(offenseNames);
  return (
    <Styled.SARHeaderContainer>
      <Styled.BackLink onClick={onBackToDashboard}>
        Back to Dashboard
      </Styled.BackLink>

      <Styled.HeaderContent>
        <Styled.TopRow>
          <Styled.ClientName>{fullName}</Styled.ClientName>
          <Styled.HeaderInfo>
            <Styled.DocID>DOC ID: {externalId}</Styled.DocID>
            {dueDate && (
              <Styled.DueDateBadge>
                Due {moment(dueDate).utc().format("MM/DD/YY")}
              </Styled.DueDateBadge>
            )}
          </Styled.HeaderInfo>
        </Styled.TopRow>

        <Styled.MetadataRow>
          {formattedGender && (
            <Styled.MetadataItem>
              <Styled.MetadataLabel>Gender:</Styled.MetadataLabel>{" "}
              <Styled.MetadataValue>{formattedGender}</Styled.MetadataValue>
            </Styled.MetadataItem>
          )}
          {age && (
            <Styled.MetadataItem>
              <Styled.MetadataLabel>Age:</Styled.MetadataLabel>{" "}
              <Styled.MetadataValue>{age}</Styled.MetadataValue>
            </Styled.MetadataItem>
          )}
          {offenseText && (
            <Styled.MetadataItem>
              <Styled.MetadataLabel>Offense:</Styled.MetadataLabel>{" "}
              <Styled.OffenseValue ref={offenseRef}>
                {offenseText}
              </Styled.OffenseValue>
            </Styled.MetadataItem>
          )}
        </Styled.MetadataRow>
      </Styled.HeaderContent>
    </Styled.SARHeaderContainer>
  );
});
