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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const WRAPPER_HEIGHT = rem(402);
const WRAPPER_WIDTH = rem(315);
const BORDER_RADIUS = rem(4);

export const CardWrapper = styled.div`
  max-width: ${WRAPPER_WIDTH};
  height: ${WRAPPER_HEIGHT};
  padding: ${rem(0)} ${rem(0)} ${rem(0)} ${rem(spacing.sm)};
  overflow: hidden;
  border-radius: ${BORDER_RADIUS};
  border: ${rem(1)} solid ${palette.slate30};
  border-top-width: ${rem(1)};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const CardHeader = styled.div`
  display: flex;
  width: 100%;
  min-height: ${rem(84)};
  max-height: ${rem(84)};
  flex-direction: row;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.md)} 0 ${rem(spacing.sm)};
`;

export const CardHeaderText = styled.div`
  display: flex;
  gap: ${rem(4)};
  flex-direction: column;
  height: fit-content;
`;

export const CardTitle = styled.h1`
  ${typography.Sans14};
  color: ${palette.pine1};
  padding: 0;
  margin: 0;
`;

export const CardSubtitle = styled.h2`
  ${typography.Sans12};
  color: ${palette.slate70};
  padding: 0;
  margin: 0;
`;

const LIST_HEIGHT = rem(496);
const LIST_WIDTH = rem(305);

export const SupervisorDetailCardList = styled.ul`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  list-style-type: none;
  width: ${LIST_WIDTH};
  height: ${LIST_HEIGHT};
  padding-left: 0;
  gap: 0;
  border-top: ${rem(1)} solid ${palette.slate20};

  &:has(> li:nth-child(6)) {
    padding-bottom: 24px;
    scrollbar-width: thin;
    overflow-y: scroll;
    mask-image: linear-gradient(
      to top,
      transparent,
      transparent 8%,
      white 15% 10%
    );
  }
`;
