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
import { forwardRef } from "react";
import styled, { css, keyframes } from "styled-components";

import { animation, Button, ButtonKind, ButtonProps } from "~design-system";

import { semantics } from "../../theme";

const { action, border, radius, space, stroke, text } = semantics;

// TODO(CO-935): Waiting on ~design-system to add a destructive Button kind. Replace this wrapper's kind with it.
export type ParoleBoardButtonKind = ButtonKind | "destructive";

export interface ParoleBoardButtonProps extends Omit<ButtonProps, "kind"> {
  /**
   * The design-system kinds, plus "destructive" for actions that delete or
   * overwrite data. A destructive button is the primary Button with its fill
   * in the error red.
   */
  kind?: ParoleBoardButtonKind;
  /**
   * True while the action the button started is in flight. The button shows
   * a spinner, sets aria-busy and is disabled, so a second click can't send
   * the action again. The native disabled attribute is what blocks a second
   * click and a form submit, so a focused button loses focus while waiting;
   * a modal that stays open should move focus back itself. Screen readers
   * support aria-busy on a button poorly, so callers should announce progress
   * themselves, for example through a live region.
   */
  waiting?: boolean;
}

// The fill holds on hover and press because the design system has no darker
// error red to step to, so a focus ring marks keyboard focus instead of the
// primary Button's focus fill. A disabled or waiting destructive button falls
// through to the primary Button's disabled look.
const destructiveStyles = css`
  &&:not(:disabled) {
    background-color: ${action.destructive};
    color: ${text.onColor};
  }

  &&:focus-visible {
    outline: ${stroke.default} solid ${border.focus};
    outline-offset: ${stroke.default};
  }
`;

// A waiting button keeps the design-system disabled look and adds the spinner.
const StyledButton = styled(Button)<{ $destructive: boolean; $link: boolean }>`
  ${({ $destructive }) => $destructive && destructiveStyles}

  &&[aria-busy="true"] {
    gap: ${rem(space.xs)};
    cursor: progress;
  }

  /* The link kind isn't a flex container, so gap alone can't space the spinner. */
  ${({ $link }) =>
    $link &&
    css`
      &&[aria-busy="true"] {
        display: inline-flex;
        align-items: center;
      }
    `}
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.span`
  display: inline-block;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  border: ${stroke.default} solid ${border.default};
  border-top-color: ${text.secondary};
  border-radius: ${radius.pill};
  animation: ${spin} ${animation.extendedDurationMs}ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * The ~design-system Button as it looks, with two additions it lacks: a
 * "destructive" kind for actions that delete or overwrite data, and a waiting
 * state that renders. The calendar's action buttons all use it.
 */
export const ParoleBoardButton = forwardRef<
  HTMLButtonElement,
  ParoleBoardButtonProps
>(function ParoleBoardButton(
  {
    kind = "primary",
    waiting = false,
    disabled = false,
    icon,
    children,
    ...rest
  },
  ref,
) {
  // TODO(CO-935): Waiting on ~design-system to render Button's waiting state. Drop the spinner, aria-busy and disabling here once Button renders them.
  return (
    <StyledButton
      {...rest}
      ref={ref}
      kind={kind === "destructive" ? "primary" : kind}
      $destructive={kind === "destructive"}
      $link={kind === "link"}
      disabled={disabled || waiting}
      aria-busy={waiting || undefined}
      // The design-system Button renders an icon in place of its children,
      // so the spinner replaces the icon while waiting.
      icon={waiting ? undefined : icon}
    >
      {waiting && (
        <Spinner aria-hidden data-testid="parole-board-button-spinner" />
      )}
      {waiting && icon ? null : children}
    </StyledButton>
  );
});
