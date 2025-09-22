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
  dropdown: React.RefObject<HTMLElement> | null;

  constructor(dropdown: React.RefObject<HTMLElement> | null) {
    this.dropdown = dropdown;
  }

  querySelector<T>(selector: string): T | null {
    const element = this.dropdown?.current?.querySelector(selector);

    if (element) {
      return element as unknown as T;
    }

    return null;
  }

  focusFirstItem(): void {
    this.querySelector<HTMLButtonElement>(
      `${MenuItemElement}:first-of-type`,
    )?.focus();
  }

  focusToggle(): void {
    this.querySelector<HTMLButtonElement>(`${ToggleElement}`)?.focus();
  }

  /**
   * Selects the next menu item after the one currently focused, otherwise wrap to the first
   */
  focusNextItem(): void {
    const focused = this.querySelector<HTMLButtonElement>(
      `${MenuItemElement}:focus`,
    );

    let next = focused?.nextElementSibling;

    // skip over any intermediate elements that are not MenuItemElements
    while (next) {
      if (next.matches(`${MenuItemElement}`)) {
        break;
      }
      next = next.nextElementSibling;
    }

    if (!next) {
      next = this.querySelector(`${MenuItemElement}:first-of-type`);
    }

    (next as HTMLButtonElement).focus();
  }

  /**
   * Selects the last menu item before the one currently focused, otherwise wrap to the last
   */
  focusPreviousItem(): void {
    const focused = this.querySelector<HTMLButtonElement>(
      `${MenuItemElement}:focus`,
    );

    let previous = focused?.previousElementSibling;

    // skip over any intermediate elements that are not MenuItemElements
    while (previous) {
      if (previous.matches(`${MenuItemElement}`)) {
        break;
      }
      previous = previous.previousElementSibling;
    }

    if (!previous) {
      previous = this.querySelector(`${MenuItemElement}:last-of-type`);
    }

    (previous as HTMLButtonElement).focus();
  }
}

export default DropdownFocusManager;
