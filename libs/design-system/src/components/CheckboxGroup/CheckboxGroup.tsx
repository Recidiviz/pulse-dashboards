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
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import styled, { css } from "styled-components";

import { palette } from "../../styles";
import { CheckboxGroupContext } from "./CheckboxGroupContext";

export type CheckboxGroupOrientation = "horizontal" | "vertical";

export interface CheckboxGroupProps {
  /** Currently selected values. */
  value: string[];
  /** Called with the next set of selected values when one is toggled. */
  onChange: (value: string[]) => void;
  /** Accessible label for the group. Required if `aria-labelledby` is not provided. */
  ariaLabel?: string;
  /** ID of an element that labels the group. */
  ariaLabelledBy?: string;
  /** Layout orientation. Affects which arrow keys advance focus. */
  orientation?: CheckboxGroupOrientation;
  /** Disable all checkboxes in the group. */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CheckboxGroupRoot = styled.div<{
  $orientation: CheckboxGroupOrientation;
}>`
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

const CHECKBOX_INPUT_SELECTOR = 'input[type="checkbox"][data-cg-item="true"]';

/**
 * CheckboxGroup
 *
 * A composable group of checkboxes with managed roving-tabindex keyboard
 * navigation, modeled after the WAI-ARIA checkbox pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) but with arrow-key
 * navigation similar to the radio group / toolbar patterns so the entire
 * group is reachable via a single tab stop.
 *
 * Keyboard interaction:
 * - Tab / Shift+Tab move focus into and out of the group. The single tab stop
 *   inside the group is the most-recently focused checkbox (or the first
 *   checkbox on initial entry).
 * - Arrow keys move focus between checkboxes *without* changing their state.
 * - Home / End move focus to the first / last checkbox.
 * - Space toggles the currently focused checkbox.
 */
export const CheckboxGroup = forwardRef(function CheckboxGroup(
  {
    value,
    onChange,
    ariaLabel,
    ariaLabelledBy,
    orientation = "vertical",
    disabled,
    className,
    children,
  }: CheckboxGroupProps,
  forwardedRef: Ref<HTMLDivElement>,
): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
  // The value of the checkbox that should be the current tab stop. Updated
  // whenever a checkbox is focused or clicked. Persists across re-renders.
  const focusedValueRef = useRef<string | null>(null);

  const toggleValue = useCallback(
    (next: string) => {
      const isSelected = value.includes(next);
      onChange(isSelected ? value.filter((v) => v !== next) : [...value, next]);
    },
    [value, onChange],
  );

  const contextValue = useMemo(
    () => ({ value, toggleValue, disabled }),
    [value, toggleValue, disabled],
  );

  const getItems = (): HTMLInputElement[] => {
    if (!ref.current) return [];
    return Array.from(
      ref.current.querySelectorAll<HTMLInputElement>(CHECKBOX_INPUT_SELECTOR),
    ).filter((el) => !el.disabled);
  };

  // Roving tabindex: only one checkbox is reachable via Tab. Default to the
  // first checkbox; once the user has interacted, remember the last-focused
  // value so re-entering the group returns there.
  useEffect(() => {
    const items = getItems();
    if (items.length === 0) return;
    items.forEach((item) => {
      item.tabIndex = -1;
    });
    const target =
      (focusedValueRef.current &&
        items.find((item) => item.value === focusedValueRef.current)) ||
      items[0];
    target.tabIndex = 0;
  });

  const focusItem = (index: number, items: HTMLInputElement[]): void => {
    const next = items[index];
    if (!next) return;
    next.focus();
    focusedValueRef.current = next.value;
    // Update tab order immediately so a follow-up Shift+Tab leaves from here.
    items.forEach((item) => {
      item.tabIndex = item === next ? 0 : -1;
    });
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
      focusItem((start + 1) % items.length, items);
      return;
    }
    if (prevKeys.includes(event.key)) {
      event.preventDefault();
      const start = currentIndex === -1 ? 0 : currentIndex;
      focusItem((start - 1 + items.length) % items.length, items);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusItem(0, items);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1, items);
    }
    // Note: Space toggling is handled natively by the underlying checkbox
    // input. We just need to remember which value was focused, which
    // happens via the input's onFocus handler in <Checkbox>.
  };

  const onFocusIn: React.FocusEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement;
    if (target.matches(CHECKBOX_INPUT_SELECTOR)) {
      focusedValueRef.current = target.value;
    }
  };

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      <CheckboxGroupRoot
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled || undefined}
        className={className}
        $orientation={orientation}
        onKeyDown={onKeyDown}
        onFocus={onFocusIn}
      >
        {children}
      </CheckboxGroupRoot>
    </CheckboxGroupContext.Provider>
  );
});
