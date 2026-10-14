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

import { Icon } from "~design-system";

import {
  ActionSlot,
  Content,
  Description,
  DismissButton,
  Heading,
  IconSlot,
  Wrapper,
} from "./Callout.styles";
import { CalloutTone, CalloutVariant } from "./types";

export type CalloutProps = {
  tone: CalloutTone;
  variant?: CalloutVariant;
  heading?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  dismiss?: { label: string; onClick: () => void };
  role?: "alert" | "status";
};

/**
 * A highlighted message with a heading, a description, or both, and an optional
 * icon, action such as a link, and dismiss button.
 *
 * Tones set the colors:
 * - neutral: gray
 * - info: blue
 * - warning: gold
 * - success: green
 * - error: red
 *
 * Variants set the shape:
 * - banner (default): an accent bar on the left, with the action to the right
 * - slim: a banner with less padding, for tight spaces
 * - card: rounded corners, with the action below the text
 */
export const Callout = ({
  tone,
  variant = "banner",
  heading,
  description,
  icon,
  action,
  dismiss,
  role,
}: CalloutProps) => (
  <Wrapper $tone={tone} $variant={variant} role={role}>
    {icon && <IconSlot $variant={variant}>{icon}</IconSlot>}
    <Content>
      {heading && <Heading>{heading}</Heading>}
      {description && (
        <Description $variant={variant}>{description}</Description>
      )}
    </Content>
    {action && <ActionSlot>{action}</ActionSlot>}
    {dismiss && (
      <DismissButton
        type="button"
        aria-label={dismiss.label}
        onClick={dismiss.onClick}
      >
        <Icon kind="Close" size={10} />
      </DismissButton>
    )}
  </Wrapper>
);
