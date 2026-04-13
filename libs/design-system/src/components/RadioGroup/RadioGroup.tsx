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

import * as React from "react";
import {
  forwardRef,
  type JSX,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import styled, { css } from "styled-components";

import { palette } from "../../styles";
import { RadioGroupContext } from "./RadioGroupContext";

export type RadioGroupOrientation = "horizontal" | "vertical";

export interface RadioGroupProps {
  /** The currently selected value. */
  value: string | undefined;
  /** Called when the selected value changes. */
  onChange: (value: string) => void;
  /** Accessible label for the group. Required if `aria-labelledby` is not provided. */
  ariaLabel?: string;
  /** ID of an element that labels the group. */
  ariaLabelledBy?: string;
  /**
   * The `name` attribute applied to the underlying radio inputs. If omitted,
   * a stable id is generated.
   */
  name?: string;
  /** Layout orientation. Affects which arrow keys advance focus. */
  orientation?: RadioGroupOrientation;
  /** Disable all radios in the group. */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const RadioGroupRoot = styled.div<{ $orientation: RadioGroupOrientation }>`
  display: flex;
  gap: 0.5rem 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  &:has(:focus-visible) {
    box-shadow:
      -1px 1px 1px 1px ${palette.signal.links},
      1px -1px 1px 1px ${palette.signal.links};
  }

  ${({ $orientation }) =>
    $orientation === "vertical"
      ? css`
          flex-direction: column;
        `
      : css`
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
        `}
`;

const RADIO_INPUT_SELECTOR = 'input[type="radio"][data-rg-item="true"]';

/**
 * RadioGroup
 *
 * Implements the WAI-ARIA radio group pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * Keyboard interaction:
 * - Tab / Shift+Tab move focus into and out of the group. The single tab stop
 *   inside the group is the currently checked radio (or the first radio if
 *   none is checked).
 * - Arrow keys move focus between radios *and* check the newly focused radio.
 * - Home / End move focus to the first / last radio (and check it).
 * - Space checks the currently focused radio.
 *
 * Focus is managed via roving tabindex on the underlying native inputs.
 */
export const RadioGroup = forwardRef(function RadioGroup(
  {
    value,
    onChange,
    ariaLabel,
    ariaLabelledBy,
    name,
    orientation = "vertical",
    disabled,
    className,
    children,
  }: RadioGroupProps,
  forwardedRef: Ref<HTMLDivElement>,
): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
  const generatedName = useId();
  const groupName = name ?? `radiogroup-${generatedName}`;

  const contextValue = useMemo(
    () => ({ name: groupName, value, onChange, disabled }),
    [groupName, value, onChange, disabled],
  );

  const getItems = (): HTMLInputElement[] => {
    if (!ref.current) return [];
    return Array.from(
      ref.current.querySelectorAll<HTMLInputElement>(RADIO_INPUT_SELECTOR),
    ).filter((el) => !el.disabled);
  };

  // Roving tabindex: only the checked radio (or the first radio when nothing
  // is checked) is reachable via Tab. The container itself is never a tab
  // stop — focus lands directly on a radio input.
  useEffect(() => {
    const items = getItems();
    if (items.length === 0) return;
    items.forEach((item) => {
      item.tabIndex = -1;
    });
    const checked = items.find((item) => item.checked);
    (checked ?? items[0]).tabIndex = 0;
  });

  const moveFocusTo = (index: number, items: HTMLInputElement[]): void => {
    const next = items[index];
    if (!next) return;
    next.focus();
    // Per APG: arrow / Home / End on a radio also selects it.
    if (next.value !== value) {
      onChange(next.value);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const items = getItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement | null;
    const currentIndex = items.findIndex((item) => item === focused);

    const isHorizontal = orientation === "horizontal";
    const nextKeys = isHorizontal
      ? ["ArrowRight", "Right", "ArrowDown", "Down"]
      : ["ArrowDown", "Down", "ArrowRight", "Right"];
    const prevKeys = isHorizontal
      ? ["ArrowLeft", "Left", "ArrowUp", "Up"]
      : ["ArrowUp", "Up", "ArrowLeft", "Left"];

    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      const start = currentIndex === -1 ? 0 : currentIndex;
      moveFocusTo((start + 1) % items.length, items);
      return;
    }
    if (prevKeys.includes(event.key)) {
      event.preventDefault();
      const start = currentIndex === -1 ? 0 : currentIndex;
      moveFocusTo((start - 1 + items.length) % items.length, items);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveFocusTo(0, items);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveFocusTo(items.length - 1, items);
    }
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <RadioGroupRoot
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled || undefined}
        className={className}
        $orientation={orientation}
        onKeyDown={onKeyDown}
      >
        {children}
      </RadioGroupRoot>
    </RadioGroupContext.Provider>
  );
});
