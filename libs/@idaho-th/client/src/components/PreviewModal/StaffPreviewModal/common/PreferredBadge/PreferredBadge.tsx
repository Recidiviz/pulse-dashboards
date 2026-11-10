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

import React from "react";
import styled from "styled-components";

import { BodyS1, palette, spacing } from "../../../../../styles";
import BookmarkIcon from "../../../../assets/pin-icon.svg?react";

const Row = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[1]};
`;

const Text = styled(BodyS1)`
  color: ${palette.misc.lapisLazuli};
`;

export const PreferredBadge: React.FC = () => (
  <Row>
    <BookmarkIcon />
    <Text>Preferred</Text>
  </Row>
);
