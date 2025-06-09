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

import { Icon, spacing, typography } from "@recidiviz/design-system";
import { rem, transparentize } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const PromptElement = styled.div`
  background-color: ${transparentize(0.9, palette.signal.highlight)};
  ${typography.Sans16}

  color: white;
  border-radius: ${rem(spacing.sm)};
  width: 100%;
  margin-bottom: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const Prompt: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PromptElement className="fs-exclude">
      <Icon size={14} kind="Info" /> {children}
    </PromptElement>
  );
};
