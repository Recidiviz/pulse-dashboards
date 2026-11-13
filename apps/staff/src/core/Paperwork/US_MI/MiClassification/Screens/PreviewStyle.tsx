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

import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import { SectionHeading } from "../Styles";

export const CenteredSpaceBetweenRow = styled(SectionHeading)`
  align-items: center;
`;

export const CompletionCard = styled.div`
  margin: 10px 0;
  padding: 10px;
  border: 1px solid ${palette.slate30};
  border-radius: 8px;
  background: ${palette.white};
`;

export const CompletionCardHeader = styled(CenteredSpaceBetweenRow)`
  padding: 10px;
`;

export const CompletionCardBody = styled.div`
  padding: 10px;
`;

export const CompletionCardText = styled.div`
  font-weight: 300;
  font-size: ${rem(15)};
  margin: 2px 0;
`;

export const StepList = styled.div`
  margin: 10px 0;
`;

export const StepRow = styled(CompletionCardText)`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const AfterCompleteHeading = styled.div`
  color: ${palette.text.primary};
  margin: 5px 0;
`;

export const AfterCompleteList = styled.ul`
  font-weight: 300;
  font-size: ${rem(15)};
`;

export const ReadOnlyCard = styled.div`
  width: 100%;
  border-radius: 8px;
  background: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  margin: 10px 0;
  padding: 12px;
`;

export const ReadOnlyLabel = styled.div`
  color: ${palette.text.primary};
`;

export const ReadOnlyHr = styled.hr`
  margin: 10px 0;
`;

export const ReadOnlyRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const ReadOnlyCompletedBy = styled.div`
  font-weight: 600;
  color: ${palette.text.primary};
  margin: 5px 0;
`;

export const BlackHr = styled.hr`
  border: 0.5px solid black;
  margin: 5px;
`;

export const CardHr = styled(BlackHr)`
  margin: 5px 0;
`;
