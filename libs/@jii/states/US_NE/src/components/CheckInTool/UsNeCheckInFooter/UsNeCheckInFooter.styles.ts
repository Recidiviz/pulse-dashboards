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

import { STICKY_HEADER_ZINDEX } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

import { CONTENT_MAX_WIDTH, FOOTER_HEIGHT } from "../constants";

// same as QuestionnaireFooter in US_MA
export const Wrapper = styled.div`
  height: ${rem(FOOTER_HEIGHT)};
  max-width: ${rem(CONTENT_MAX_WIDTH)};
  display: flex;
  justify-content: end;
  align-items: center;
  gap: ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate20};
  bottom: 0;
  left: 0;
  margin: 0 auto;
  padding: 0 ${rem(spacing.xl + spacing.sm)};
  position: fixed;
  right: 0;
  z-index: ${STICKY_HEADER_ZINDEX};
`;

export const Info = styled.div`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin-right: auto;
`;
