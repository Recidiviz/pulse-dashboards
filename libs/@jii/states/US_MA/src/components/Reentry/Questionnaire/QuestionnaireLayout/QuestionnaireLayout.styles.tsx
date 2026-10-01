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

import {
  FullBleedContainer,
  HIDDEN_HEADER_OFFSET,
  STICKY_HEADER_ZINDEX,
} from "~@jii/common-ui";
import { PAGE_LAYOUT_HEADER_GAP } from "~@jii/layout";
import { palette, spacing, typography } from "~design-system";

import {
  QUESTIONNAIRE_CONTENT_MAX_WIDTH,
  QUESTIONNAIRE_FOOTER_HEIGHT,
} from "../constants";

export const Wrapper = styled(FullBleedContainer)`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  margin-top: -${rem(PAGE_LAYOUT_HEADER_GAP)};
`;

export const Header = styled.header`
  height: ${rem(HIDDEN_HEADER_OFFSET)};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${palette.pine2};
  left: 0;
  padding: 0 ${rem(spacing.lg)};
  position: fixed;
  right: 0;
  top: 0;
  z-index: ${STICKY_HEADER_ZINDEX};
`;

export const Title = styled.span`
  ${typography.Sans16}

  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  color: ${palette.marble1};
`;

export const HeaderActionButton = styled.button`
  ${typography.Sans14}

  background: none;
  border: none;
  color: ${palette.marble1};
  cursor: pointer;
  padding: 0;
`;

export const Content = styled.main`
  width: 100%;
  max-width: ${rem(QUESTIONNAIRE_CONTENT_MAX_WIDTH)};
  flex: 1;
  background: ${palette.marble1};
  margin: 0 auto;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  padding-bottom: calc(
    ${rem(QUESTIONNAIRE_FOOTER_HEIGHT)} + ${rem(spacing.lg)}
  );
`;
