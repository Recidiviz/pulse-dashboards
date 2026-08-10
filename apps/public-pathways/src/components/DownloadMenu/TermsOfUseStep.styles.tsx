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

import { Button, ModalHeading, spacing } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

export const TermsHeading = styled(ModalHeading)`
  font-weight: 700;
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  margin-top: 0.75rem;
  margin-bottom: 0;
`;

export const TermsBody = styled.div`
  ${publicPathwaysTypography.Sans16}
  max-height: ${rem(220)};
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid ${publicPathwaysPalette.slate10};
  background-color: ${publicPathwaysPalette.marble3};
  font-weight: 500;
  line-height: 160%;
  color: ${publicPathwaysPalette.text.primary};

  p {
    margin: 0 0 ${rem(spacing.sm)};
  }

  ol {
    margin: 0;
    padding-left: 1.25rem;
    list-style: decimal;
  }

  li {
    display: list-item;
    margin-bottom: ${rem(spacing.sm)};
  }

  p:last-child,
  li:last-child {
    margin-bottom: 0;
  }
`;

export const TermsAgreementRow = styled.div`
  .ds-checkbox {
    align-items: center;
  }
`;

export const TermsActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${rem(spacing.xs)};
`;

export const AgreeButton = styled(Button)`
  font-weight: 700;
  min-height: ${rem(44)};
  padding: ${rem(spacing.sm)} ${rem(spacing.lg)};
  font-size: ${rem(15)};
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  background-color: ${publicPathwaysPalette.focusColor};
  border-color: ${publicPathwaysPalette.focusColor};

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: ${publicPathwaysPalette.focusColor};
    border-color: ${publicPathwaysPalette.focusColor};
  }
`;

export const BackButton = styled(Button)`
  min-width: auto;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  color: ${publicPathwaysPalette.text.primary};

  &:hover,
  &:focus-visible,
  &:active {
    color: ${publicPathwaysPalette.text.primary};
  }
`;
