// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Page } from "playwright";

export const switchTenant = async (
  page: Page,
  stateName: string,
): Promise<void> => {
  // TODO #5162 - find by locator .ProfileLink once the class is added to the button in all layouts
  await page.getByRole("navigation").getByRole("button").click();
  await page.getByRole("link", { name: "Profile" }).click();
  await page.getByRole("button", { name: stateName }).click();
};
