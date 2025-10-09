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

import { ToolbarItemElement } from "./ToolbarItem";

class ToolbarFocusManager {
  toolbar: React.RefObject<HTMLElement> | null;

  constructor(toolbar: React.RefObject<HTMLElement> | null) {
    this.toolbar = toolbar;
  }

  querySelector<T>(selector: string): T | null {
    const element = this.toolbar?.current?.querySelector(selector);

    if (element) {
      return element as unknown as T;
    }

    return null;
  }

  /**
   * Gets all focusable toolbar items within the toolbar.
   */
  private getToolbarItems(): HTMLElement[] {
    if (!this.toolbar?.current) {
      return [];
    }
    return Array.from(
      this.toolbar?.current?.querySelectorAll(`${ToolbarItemElement}`) ?? [],
    ) as HTMLElement[];
  }

  /**
   * Gets the first focusable element (button or link) within a toolbar item
   */
  private getFocusableElementInItem(item: HTMLElement): HTMLElement | null {
    const focusableElement = item.querySelector("button, a");
    return focusableElement as HTMLElement | null;
  }

  /**
   * Selects the first toolbar item
   */
  focusFirstItem(): void {
    const items = this.getToolbarItems();
    if (items.length === 0) return;

    const focusableElement = this.getFocusableElementInItem(items[0]);
    focusableElement?.focus();
  }

  /**
   * Selects the next toolbar item after the one currently focused, otherwise wrap to the first
   */
  focusNextItem(): void {
    const items = this.getToolbarItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;

    // Find which toolbar item contains the currently focused element
    const currentIndex = items.findIndex((item) => {
      return item === focused || item.contains(focused);
    });

    if (currentIndex === -1) {
      // If no toolbar item is focused, focus the first one.
      const focusableElement = this.getFocusableElementInItem(items[0]);
      focusableElement?.focus();
    } else {
      // Wrap to the first item if we're at the end
      const nextIndex = (currentIndex + 1) % items.length;
      const focusableElement = this.getFocusableElementInItem(items[nextIndex]);
      focusableElement?.focus();
    }
  }

  /**
   * Selects the last toolbar item before the one currently focused, otherwise wrap to the last
   */
  focusPreviousItem(): void {
    const items = this.getToolbarItems();
    if (items.length === 0) return;

    const focused = document.activeElement as HTMLElement;

    // Find which toolbar item contains the currently focused element
    const currentIndex = items.findIndex(
      (item) => item === focused || item.contains(focused),
    );

    if (currentIndex <= 0) {
      // If no toolbar item is focused, focus the last one.
      const focusableElement = this.getFocusableElementInItem(
        items[items.length - 1],
      );
      focusableElement?.focus();
    } else {
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      const focusableElement = this.getFocusableElementInItem(items[prevIndex]);
      focusableElement?.focus();
    }
  }
}

export default ToolbarFocusManager;
