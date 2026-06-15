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

import { Description, Stories, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react";

import { GlobalStyle } from "./GlobalStyle";

/**
 * `GlobalStyle` is a `createGlobalStyle` block that resets the page baseline.
 * It applies a `box-sizing: border-box` reset to every element, a focus outline
 * tuned to the design-system signal color, a heading line-height reset that
 * removes default margins, and a body font, color, and background.
 */
const meta: Meta = {
  title: "Shared/Design System/Components/GlobalStyle",
  // this hides the individual stories in the sidebar, showing only docs
  tags: ["!dev"],
  parameters: {
    docs: {
      page: () => (
        <>
          <Title />
          <Description />
          <Stories />
        </>
      ),
    },
  },
};

export default meta;

/**
 * Renders `<GlobalStyle />` followed by a sample block exercising heading,
 * paragraph, and strong styling under the reset.
 */
export const Default: StoryObj<typeof meta> = {
  render: () => (
    <>
      <GlobalStyle />
      <div>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
        <p>
          The quick brown fox jumps over the lazy dog. This paragraph contains a{" "}
          <strong>strong</strong> emphasis to demonstrate the bolder weight.
        </p>
      </div>
    </>
  ),
};
