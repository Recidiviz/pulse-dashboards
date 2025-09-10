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

import AxeBuilder from "@axe-core/playwright";
import { expect, Page } from "@playwright/test";

export function clearAllLoaders(page: Page) {
  return expect(page.getByText("Loading data...").last()).toBeHidden();
}

export async function accessibilityScan(page: Page) {
  // there is a known contrast issue with the design system loading spinner,
  // for now we just ignore it by waiting for the spinner to go away
  // (hard to target it for exclusion consistently via CSS)
  await clearAllLoaders(page);

  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}
