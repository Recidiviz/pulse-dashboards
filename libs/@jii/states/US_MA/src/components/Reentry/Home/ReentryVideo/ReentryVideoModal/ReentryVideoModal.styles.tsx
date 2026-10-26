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

import { rem, rgba } from "polished";
import styled from "styled-components";

import { PAGE_WIDTH } from "~@jii/common-ui";
import { Modal, palette, spacing, typography } from "~design-system";

// TODO(OBT-55332): replace this modal with the ~@jii/onboarding-video lightbox.
// Until then, these styles copy its AboutVideoModal so the switch looks the same.
export const VideoModal = styled(Modal)`
  .ReactModal__Content {
    background-color: black;
    border-radius: unset;
    box-shadow: unset;
    padding: ${rem(spacing.xs)};
    width: ${rem(PAGE_WIDTH)};
  }

  .ReactModal__Overlay {
    backdrop-filter: unset;
    background-color: ${rgba("black", 0.9)};
  }
`;

export const VideoContainer = styled.div`
  ${typography.Sans14}

  align-items: center;
  aspect-ratio: 16 / 12;
  color: ${palette.white70};
  display: flex;
  justify-content: center;

  video {
    height: 100%;
    object-fit: contain;
    object-position: top;
    width: 100%;
  }
`;
