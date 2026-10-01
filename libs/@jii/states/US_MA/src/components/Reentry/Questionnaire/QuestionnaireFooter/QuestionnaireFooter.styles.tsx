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
import { Button, palette, spacing } from "~design-system";

import {
  QUESTIONNAIRE_CONTENT_MAX_WIDTH,
  QUESTIONNAIRE_FOOTER_HEIGHT,
} from "../constants";

export const Wrapper = styled.div`
  height: ${rem(QUESTIONNAIRE_FOOTER_HEIGHT)};
  max-width: ${rem(QUESTIONNAIRE_CONTENT_MAX_WIDTH)};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${rem(spacing.md)};
  background: ${palette.marble1};
  border-top: 1px solid ${palette.slate20};
  bottom: 0;
  left: 0;
  margin: 0 auto;
  padding: 0 ${rem(spacing.xl + spacing.sm)};
  position: fixed;
  right: 0;
  z-index: ${STICKY_HEADER_ZINDEX};
`;

export const BackLinkButton = styled(Button)`
  font-weight: 700;
`;

export const LeadingActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.lg)};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  margin-left: auto;
`;
