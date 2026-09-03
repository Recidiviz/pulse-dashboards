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

import type { Meta, StoryObj } from "@storybook/react";

import { RowDivider } from "./RowDivider";

/**
 * A hairline rule for separating stacked content. Pair it with `ActivityList`
 * and `ActivityRow` for a label/value list, or use it on its own between any
 * blocks of content.
 */
const meta = {
  title: "Common UI/RowDivider",
  component: RowDivider,
} satisfies Meta<typeof RowDivider>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <div>
      <p>Is this a problem for you right now?</p>
      <RowDivider />
      <p>How interested are you in improving this?</p>
      <RowDivider />
      <p>What would you like to work on?</p>
    </div>
  ),
};

/**
 * The divider hides itself when it is the last child of its container, so a
 * list can render one after every item without a stray rule at the bottom.
 */
export const HiddenAsLastChild: StoryObj<typeof meta> = {
  render: () => (
    <div>
      <p>First item</p>
      <RowDivider />
      <p>Second item</p>
      <RowDivider />
    </div>
  ),
};
