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

import { Card, CardHeading, CardValue, TwoColumnCardWrapper } from "./Card";

/**
 * The Card component will accept any children, but it is mainly designed
 * to go hand in hand with CardHeading and CardValue
 */
const meta = {
  title: "Common UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type CardStory = StoryObj<typeof meta>;

export const Default: CardStory = {
  render: () => (
    <Card>
      <CardHeading>Card heading</CardHeading>
      <CardValue>Card value</CardValue>
    </Card>
  ),
};

export const TwoColumn: CardStory = {
  render: () => (
    <TwoColumnCardWrapper>
      <Card>
        <CardHeading>Card heading</CardHeading>
        <CardValue>March 15, 2026</CardValue>
      </Card>
      <Card>
        <CardHeading>Card heading</CardHeading>
        <CardValue>432 days</CardValue>
      </Card>
    </TwoColumnCardWrapper>
  ),
};
