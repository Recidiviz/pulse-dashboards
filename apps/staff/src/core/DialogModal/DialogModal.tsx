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

import { Modal, ModalProps, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.xl)};
    max-width: 85vw;
    width: ${rem(600)};
    display: flex;
    flex-direction: column;
  }
`;

export function DialogModal({ children, ...props }: ModalProps) {
  return <StyledModal {...props}>{children}</StyledModal>;
}
