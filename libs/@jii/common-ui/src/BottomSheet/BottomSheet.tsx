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

import { Modal } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components";

import { palette, spacing, typography } from "~design-system";

import { PageContainer } from "../BaseLayout/BaseLayout";

// How long the slide-up/slide-down animation runs, in milliseconds. This matches
// the base Modal's `transform` transition (300ms) and is passed to react-modal's
// `closeTimeoutMS` so the closing animation can play before the modal unmounts.
const ANIMATION_MS = 300;

/**
 * `BottomSheet` reuses the design-system `Modal` (a wrapper around react-modal)
 * for its backdrop, focus trapping, and scroll locking, but restyles it to sit
 * at the bottom of the screen and slide up, instead of the default centered box.
 */
const StyledBottomSheet = styled(Modal)`
  .ReactModal__Content {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(100%);

    width: 100%;
    max-width: 100%;
    /* Cap the height and scroll inside if the content is tall. */
    max-height: 90vh;
    min-height: 75vh;
    overflow-y: auto;

    border-radius: 0;
    padding: ${rem(spacing.lg)} 0 ${rem(spacing.xl)};
  }

  .ReactModal__Overlay[class*="--after-open"] .ReactModal__Content {
    transform: translateY(0);
  }

  /* While closing, slide it back down off-screen before it unmounts. */
  .ReactModal__Overlay[class*="--before-close"] .ReactModal__Content {
    transform: translateY(100%);
  }

  .ReactModal__Overlay {
    background-color: rgba(0, 0, 0, 0.25);
  }
`;

const CloseButton = styled.button`
  ${typography.Sans16}

  background: none;
  border: none;
  cursor: pointer;
  color: ${palette.pine4};
  padding: ${rem(spacing.sm)} 0;
  margin-bottom: ${rem(spacing.xxl)};
`;

export type BottomSheetProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  ariaLabel: string;
};

export const BottomSheet: FC<BottomSheetProps> = ({
  isOpen,
  onRequestClose,
  children,
  closeLabel = "Close",
  ariaLabel,
}) => (
  <StyledBottomSheet
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    closeTimeoutMS={ANIMATION_MS}
    contentLabel={ariaLabel}
  >
    <PageContainer>
      <CloseButton type="button" onClick={onRequestClose}>
        {closeLabel}
      </CloseButton>
      {children}
    </PageContainer>
  </StyledBottomSheet>
);
