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

import { Icon, Modal, Sans16, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

export const Wrapper = styled.div`
  color: ${palette.slate85};
`;

export const StyledModal = styled(Modal)<{ isMobile: boolean }>`
  .ReactModal__Content {
    display: flex;
    flex-direction: column;
    width: ${rem(768)};
    height: ${rem(800)};
    padding: 0;
    box-shadow: 0px 0px 8px 0px #0000004d;
    border-radius: unset;

    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
      max-height: unset !important;
      width: 100% !important;
      height: 100% !important;`}
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.slate20};
`;

export const ModalTitle = styled(Sans16)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  color: ${palette.pine1};

  i {
    font-size: ${rem(20)};
    font-weight: 600;
    padding-right: ${rem(spacing.sm)};
    &:hover {
      cursor: pointer;
    }
  }
`;

export const ModalCloseButton = styled(Icon)`
  color: ${palette.slate60};
  &:hover {
    cursor: pointer;
  }
`;
