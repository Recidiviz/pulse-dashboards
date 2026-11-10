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

import styled from "styled-components";

import {
  BodyS1,
  borderRadius,
  Caption1,
  palette,
  spacing,
} from "../../../../styles";
import { buttonOutline } from "../../../common/StyledComponents";

// Re-export ConfirmationModal chrome pieces so the modal uses the same header/footer
// structure without duplicating styled-component definitions.
export {
  CloseButton,
  FooterSpacer,
  HeaderTextGroup,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from "../../../ConfirmationModal/ConfirmationModal.styles";

/* ── Modal body ────────────────────────────────────────── */

export const ModalBody = styled.div`
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0.75rem 1.5rem;
  width: 100%;
`;

export const StateContainer = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  padding: ${spacing[4]} 0;
  width: 100%;
`;

export const StateMessage = styled(BodyS1)<{ $error?: boolean }>`
  color: ${({ $error }) =>
    $error ? palette.foreground.attention : palette.foreground.secondary};
  text-align: center;
`;

export const ProvidersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;

/* ── Slots rendered inside the shared ProviderCard ─────── */

/** "Select as Home Plan" button rendered in the belowDescription slot */
export const SelectButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  color: ${palette.foreground.onBrand};
  cursor: pointer;
  display: flex;
  flex: none;
  font-size: 0.875rem;
  font-weight: 600;
  gap: ${spacing[2]};
  height: 2rem;
  justify-content: center;
  letter-spacing: -0.0175rem;
  line-height: 1rem;
  padding: 0 ${spacing[3]};
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;

/** Status badge rendered in the trailing slot */
export const CardStatusBadge = styled.div`
  align-items: center;
  background: ${palette.background.brandLight};
  border-radius: ${borderRadius[8]};
  display: flex;
  flex: none;
  padding: 0 ${spacing[2]};
  height: 1.5rem;
`;

export const CardStatusText = styled(Caption1)`
  color: ${palette.foreground.brand};
  white-space: nowrap;
`;
