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

import { ReactNode } from "react";

import {
  ActionSlot,
  Content,
  Description,
  Heading,
  IconSlot,
  Wrapper,
} from "./Callout.styles";
import { CalloutTone, CalloutVariant } from "./types";

export type CalloutProps = {
  tone: CalloutTone;
  variant?: CalloutVariant;
  heading: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
};

/**
 * A highlighted message with a heading and description, an optional icon,
 * and an optional action such as a link.
 *
 * Tones set the colors:
 * - neutral: gray
 * - info: blue
 *
 * Variants set the shape:
 * - banner (default): an accent bar on the left, with the action to the right
 * - card: rounded corners, with the action below the text
 */
export const Callout = ({
  tone,
  variant = "banner",
  heading,
  description,
  icon,
  action,
}: CalloutProps) => (
  <Wrapper $tone={tone} $variant={variant}>
    {icon && <IconSlot>{icon}</IconSlot>}
    <Content>
      <Heading>{heading}</Heading>
      <Description $variant={variant}>{description}</Description>
    </Content>
    {action && <ActionSlot>{action}</ActionSlot>}
  </Wrapper>
);
