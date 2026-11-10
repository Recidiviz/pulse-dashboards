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

import * as Styled from "./ProviderDetailView.styles";

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}

export const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <Styled.InfoItem>
    <Styled.InfoItemLeft>
      <Styled.InfoIcon>{icon}</Styled.InfoIcon>
      <Styled.InfoLabel>{label}</Styled.InfoLabel>
    </Styled.InfoItemLeft>
    {value}
  </Styled.InfoItem>
);
