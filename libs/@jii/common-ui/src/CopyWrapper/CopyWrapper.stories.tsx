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
import { MemoryRouter } from "react-router-dom";

import { CopyWrapper } from "./CopyWrapper";

const SAMPLE_MARKDOWN = `# Page title

## Section heading

This is the first paragraph of body copy. It contains a few sentences to show how text wraps and
how the line height and font size look at normal reading length. For more detail,
[see the full documentation](#).

This is the second paragraph. More filler text goes here to demonstrate paragraph spacing.
The quick brown fox jumps over the lazy dog again for good measure.

### Subsection heading

Unordered list:

- First item
- Second item
- Third item
  - Nested item A
  - Nested item B
- Fourth item

---

Ordered list with nested items:

1. First step
2. Second step, which includes:
   - Sub-item alpha
   - Sub-item beta
   - Sub-item gamma
3. Third step
4. Fourth step, with sub-steps:
   1. Sub-step one
   2. Sub-step two
   3. Sub-step three
`;

const meta = {
  title: "Common UI/CopyWrapper",
  component: CopyWrapper,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    overrides: { table: { disable: true } },
    options: { table: { disable: true } },
  },
  args: {
    children: SAMPLE_MARKDOWN,
  },
} satisfies Meta<typeof CopyWrapper>;

export default meta;

/**
 * Headings and most other basic Markdown features are styled
 */
export const Markdown: StoryObj<typeof meta> = {};

/**
 * HTML table markup is supported in addition to Markdown
 */
export const Table: StoryObj<typeof meta> = {
  args: {
    children: `## Table example

This paragraph appears before the table. The quick brown fox jumps over the lazy dog.

<table>
  <thead>
    <tr>
      <th>Column A</th>
      <th>Column B</th>
      <th>Column C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Row 1, cell 1</td>
      <td>Row 1, cell 2</td>
      <td>Row 1, cell 3</td>
    </tr>
    <tr>
      <td>Row 2, cell 1</td>
      <td>Row 2, cell 2</td>
      <td>Row 2, cell 3</td>
    </tr>
    <tr>
      <td>Row 3, cell 1</td>
      <td>Row 3, cell 2</td>
      <td>Row 3, cell 3</td>
    </tr>
  </tbody>
</table>
`,
  },
};

/**
 * HTML dl markup is supported in addition to Markdown
 */
export const DefinitionList: StoryObj<typeof meta> = {
  args: {
    children: `## Definition list example

<dl>
  <dt>Term one</dt>
  <dd>A short definition for the first term. The quick brown fox jumps over the lazy dog.</dd>
  <dt>Term two</dt>
  <dd>A longer definition for the second term. More filler text goes here to show how the layout handles wrapping across multiple lines when the definition is longer than a single sentence.</dd>
  <dt>Term three</dt>
  <dd>

- First point under term three
- Second point under term three

  </dd>
</dl>
`,
  },
};
