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

import moment from "moment";
import React from "react";

import { SARAttributes } from "../../datastores/types";
import { SentencingAssessmentReportSection } from "./ReportBlock";
import { SECTION_COLUMN_GAP } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

interface ReportRequestedOfProps {
  dateRequested: SARAttributes["dateRequested"];
  updatedAt: SARAttributes["updatedAt"];
  staff: SARAttributes["staff"];
}

export const ReportRequestedOf: React.FC<ReportRequestedOfProps> = ({
  dateRequested,
  updatedAt,
  staff,
}) => (
  <SentencingAssessmentReportSection
    title="Requested Of"
    note={`Requested ${dateRequested ? moment(dateRequested).format("MM/DD/YY") : "—"} | Completed ${updatedAt ? moment(updatedAt).format("MM/DD/YY") : "—"}`}
  >
    <Styled.RowFlexContainer gap={SECTION_COLUMN_GAP}>
      <Styled.ColumnFlexContainer>
        <Styled.Label>Officer:</Styled.Label>
        <Styled.Value>{staff?.externalId}</Styled.Value>
        <Styled.Value>{staff?.fullName}</Styled.Value>
      </Styled.ColumnFlexContainer>
      <Styled.ColumnFlexContainer>
        <Styled.Label>District:</Styled.Label>
        <Styled.Value>{staff?.district?.name || ""}</Styled.Value>
      </Styled.ColumnFlexContainer>
      <Styled.ColumnFlexContainer>
        <Styled.Label>Address:</Styled.Label>
        <Styled.Value>{staff?.officeAddress}</Styled.Value>
      </Styled.ColumnFlexContainer>
      <Styled.ColumnFlexContainer>
        <Styled.Label>Phone:</Styled.Label>
        <Styled.Value>{staff?.officePhoneNumber}</Styled.Value>
      </Styled.ColumnFlexContainer>
    </Styled.RowFlexContainer>
  </SentencingAssessmentReportSection>
);
