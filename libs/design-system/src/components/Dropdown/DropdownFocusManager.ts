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

import * as React from "react";

import { MenuItemElement, ToggleElement } from "./Dropdown.styles";

class DropdownFocusManager {
  dropdown: React.RefObject<HTMLElement | null> | null;

  constructor(dropdown: React.RefObject<HTMLElement | null> | null) {
    this.dropdown = dropdown;
  }

  querySelector<T>(selector: string): T | null {
    const element = this.dropdown?.current?.querySelector(selector);

    if (element) {
      return element as unknown as T;
    }

    return null;
  }

  /**
   * Gets all focusable menu items within the dropdown.
   */
  private getMenuItems(): HTMLElement[] {
    if (!this.dropdown?.current) {
      return [];
    }
    return Array.from(
      this.dropdown?.current?.querySelectorAll(`${MenuItemElement}`) ?? [],
    ) as HTMLElement[];
  }

  focusFirstItem(): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;
    items[0]?.focus();
  }

  focusToggle(): void {
    this.querySelector<HTMLButtonElement>(`${ToggleElement}`)?.focus();
  }

  /**
   * Selects the next menu item after the one currently focused, otherwise wrap to the first
   */
  focusNextItem(): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;

    // Find which menu item contains the currently focused element
    const currentIndex = items.findIndex(
      (item) => item === focused || item.contains(focused)
    );

    if (currentIndex === -1) {
      // If no menu item is focused, focus the first one.
      items[0]?.focus();
    } else {
      // Wrap to the first item if we're at the end
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    }
  }

  /**
   * Selects the last menu item before the one currently focused, otherwise wrap to the last
   */
  focusPreviousItem(): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;

    // Find which menu item contains the currently focused element
    const currentIndex = items.findIndex(
      (item) => item === focused || item.contains(focused)
    );

    if (currentIndex <= 0) {
      // If no menu item is focused, focus the last one.
      items[items.length - 1]?.focus();
    } else {
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex]?.focus();
    }
  }
}

export default DropdownFocusManager;
