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
import { fn } from "storybook/test";

import AccordionExample, {
  type AccordionExampleArgs,
} from "./examples/example";
import exampleSource from "./examples/example?raw";

const meta: Meta<AccordionExampleArgs> = {
  title: "Common UI/Accordion",
  render: (args) => <AccordionExample {...args} />,
  parameters: {
    docs: {
      codePanel: true,
      source: { code: exampleSource },
    },
  },
  argTypes: {
    copy: { control: "object" },
    onToggle: { table: { disable: true } },
  },
  args: {
    copy: {
      panel1: {
        header: "Section one",
        content:
          "This is the first paragraph of the first section. The quick brown fox jumps over the lazy dog.\n\nThis is the second paragraph. It includes **bold text** to emphasize key points and *italic text* for subtle emphasis or terminology.",
      },
      panel2: {
        header: "Section two",
        content:
          "This section contains more detailed information. The quick brown fox jumps over the lazy dog for good measure.\n\nA second paragraph appears here with **important terms in bold** and *gentle emphasis in italics* to show how inline formatting looks within body copy.",
      },
      panel3: {
        header: "Section three",
        content:
          "A short opening sentence introduces the topic. The quick brown fox jumps over the lazy dog.\n\nThe second paragraph wraps up the section. Use **bold** for the most critical information and *italics* for titles or light emphasis.",
      },
    },
    onToggle: fn(),
  },
};

export default meta;

export const Default: StoryObj<typeof meta> = {};
