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
import styled from "styled-components";

export type SectionStatus = "empty" | "incomplete" | "complete";

interface StatusIndicatorProps {
  status: SectionStatus;
}

const WarningIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: #E0A852;
  flex-shrink: 0;
`;

const CompleteIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: #00C49D;
  flex-shrink: 0;
`;

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  if (status === "incomplete") {
    return (
      <WarningIcon viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 12C7.4 12 7 11.6 7 11C7 10.4 7.4 10 8 10C8.6 10 9 10.4 9 11C9 11.6 8.6 12 8 12ZM9 9H7V4H9V9Z" />
      </WarningIcon>
    );
  }

  if (status === "complete") {
    return (
      <CompleteIcon viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM7.35355 11.0464C7.15829 11.2417 6.84171 11.2417 6.64645 11.0464L3.95355 8.35355C3.75829 8.15829 3.75829 7.84171 3.95355 7.64645L4.64645 6.95355C4.84171 6.75829 5.15829 6.75829 5.35355 6.95355L7 8.6L10.6464 4.95355C10.8417 4.75829 11.1583 4.75829 11.3536 4.95355L12.0464 5.64645C12.2417 5.84171 12.2417 6.15829 12.0464 6.35355L7.35355 11.0464Z" />
      </CompleteIcon>
    );
  }

  // Empty sections show no icon
  return null;
};
