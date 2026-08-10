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

import { Stepper } from "./Stepper";

const meta = {
  title: "Shared/Design System/Components/Stepper",
  component: Stepper,
  argTypes: {
    steps: { table: { disable: true } },
    currentStep: { control: { type: "range", min: 0, max: 2, step: 1 } },
    compact: { control: "boolean" },
    accentColor: { control: "color" },
  },
  args: {
    steps: ["First step", "Second step", "Third step"],
    currentStep: 0,
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type StepperStory = StoryObj<typeof meta>;

export const FirstStep: StepperStory = {
  args: { currentStep: 0 },
};

export const SecondStep: StepperStory = {
  args: { currentStep: 1 },
};

export const LastStep: StepperStory = {
  args: { currentStep: 2 },
};

export const Compact: StepperStory = {
  args: { currentStep: 1, compact: true },
};
