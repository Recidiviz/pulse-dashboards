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

import styled from "styled-components";

import { BodyM1, BodyS1, palette, spacing } from "../../../styles";

export const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const EditRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
  width: 100%;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  margin-top: ${spacing[1.5]};
`;

export const FieldLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const FieldValue = styled(BodyM1)`
  color: ${palette.foreground.primary};
  flex: 1 1 auto;
`;

export const Divider = styled.div`
  background: ${palette.border.subtle};
  height: 0.0625rem;
  width: 100%;
`;
