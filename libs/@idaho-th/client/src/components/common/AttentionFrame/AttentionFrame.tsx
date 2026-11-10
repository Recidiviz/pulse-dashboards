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

import * as Styled from "./AttentionFrame.styles";

interface AttentionFrameProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  children: React.ReactNode;
  hideFrame?: boolean;
}

/**
 * Frames a section as the part of the case that needs attention right now.
 */
export const AttentionFrame: React.FC<AttentionFrameProps> = ({
  active,
  activeLabel = "CURRENT STEP",
  inactiveLabel = "NEXT STEP",
  hideFrame = false,
  children,
}) => {
  if (hideFrame) return <>{children}</>;
  return (
    <Styled.Card $isActive={active}>
      <Styled.Header>
        {active && <Styled.Dot aria-hidden />}
        <Styled.Label $isActive={active}>
          {active ? activeLabel : inactiveLabel}
        </Styled.Label>
      </Styled.Header>
      <Styled.Content>{children}</Styled.Content>
    </Styled.Card>
  );
};
