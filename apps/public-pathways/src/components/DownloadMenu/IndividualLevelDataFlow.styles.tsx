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

import { Modal, spacing, Stepper } from "~design-system";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

// Single modal shell shared by both wizard steps, so the frame doesn't
// visually resize/jump when moving from "choose snapshot" to "terms of use".
// A column flex layout with a consistent gap replaces manual margins between
// each step's sections (heading, banner, body, action row, ...).
export const WizardModal = styled(Modal)`
  .ReactModal__Content {
    width: 41.5rem;
    font-family: ${PROXIMA_NOVA_FONT_FAMILY};
    display: flex;
    flex-direction: column;
    gap: ${rem(spacing.md)};
  }
`;

// Sized to its own content (rather than the Stepper's default full-width
// layout) and centered within the wider modal. `min-width` gives each step
// column enough room that its label doesn't wrap onto a second line.
export const WizardStepper = styled(Stepper)`
  width: fit-content;
  min-width: 320px;
  margin: 0 auto;
`;
