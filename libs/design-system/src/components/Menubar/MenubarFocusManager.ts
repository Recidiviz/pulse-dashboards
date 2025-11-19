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

class MenubarFocusManager {
  menubar: React.RefObject<HTMLElement | null> | null;

  constructor(menubar: React.RefObject<HTMLElement | null> | null) {
    this.menubar = menubar;
  }

  /**
   * Gets all focusable menu items within the menubar.
   */
  private getMenuItems(): HTMLElement[] {
    if (!this.menubar?.current) {
      return [];
    }
    // Get all menu items
    const allItems = Array.from(
      this.menubar.current.querySelectorAll('[role="menuitem"]'),
    ) as HTMLElement[];

    // Filter out items that are inside a submenu
    return allItems.filter((item) => item.closest('[role="menu"]') === null);
  }

  /**
   * Selects the first menu item
   */
  focusFirstItem(): void {
    const items = this.getMenuItems();
    if (items.length > 0) {
      items[0].focus();
    }
  }

  /**
   * Selects the next menu item after the one currently focused, otherwise wrap to the first
   */
  focusNextItem(): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;
    const currentIndex = items.findIndex((item) => item === focused);

    if (currentIndex === -1) {
      // If no menu item is focused, focus the first one.
      items[0].focus();
    } else {
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    }
  }

  /**
   * Selects the last menu item before the one currently focused, otherwise wrap to the last
   */
  focusPreviousItem(): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;
    const currentIndex = items.findIndex((item) => item === focused);

    if (currentIndex <= 0) {
      // If no menu item is focused, focus the last one.
      items[items.length - 1].focus();
    } else {
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
    }
  }
}

export default MenubarFocusManager;
