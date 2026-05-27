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

import { ActivityList, ActivityRow, RowDivider } from "./ActivityList";

/**
 * Use `ActivityList`, `ActivityRow` and `RowDivider` together
 * to create a simple two-column list.
 */
const meta = {
  title: "Common UI/ActivityList",
  component: ActivityList,
} satisfies Meta<typeof ActivityList>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <ActivityList>
      <ActivityRow>
        <span>First activity</span>
        <span>+4</span>
      </ActivityRow>
      <RowDivider />
      <ActivityRow>
        <span>Second activity</span>
        <span>+2</span>
      </ActivityRow>
      <RowDivider />
      <ActivityRow>
        <span>Third activity</span>
        <span>−1</span>
      </ActivityRow>
      <RowDivider />
      <ActivityRow>
        <span>Fourth activity</span>
        <span>+7</span>
      </ActivityRow>
    </ActivityList>
  ),
};
