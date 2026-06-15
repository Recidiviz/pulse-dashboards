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

import { spacing } from "../../styles";
import { Card, CardSection } from "./Card.styles";

const sectionStyle = { padding: `${spacing.lg}px` };

const meta = {
  title: "Shared/Design System/Components/Card",
  component: Card,
  argTypes: {
    stacked: { control: "boolean" },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof Card>;

export default meta;

type CardStory = StoryObj<typeof meta>;

export const Default: CardStory = {
  args: { stacked: false },
  render: (args) => (
    <Card {...args}>
      <CardSection style={sectionStyle}>Section A</CardSection>
      <CardSection style={sectionStyle}>Section B</CardSection>
    </Card>
  ),
};

export const Stacked: CardStory = {
  args: { stacked: true },
  render: (args) => (
    <Card {...args}>
      <CardSection style={sectionStyle}>Section A</CardSection>
      <CardSection style={sectionStyle}>Section B</CardSection>
    </Card>
  ),
};

export const Single: CardStory = {
  args: { stacked: false },
  render: (args) => (
    <Card {...args}>
      <CardSection style={sectionStyle}>Section A</CardSection>
    </Card>
  ),
};
