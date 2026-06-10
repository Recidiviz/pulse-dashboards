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
import { rem } from "polished";
import styled from "styled-components";

import { spacing } from "./spacing";
import { typography, TYPOGRAPHY_LEVELS } from "./typography";

const shortCopy = `Lorem ipsum dolor sit amet`;
const longCopy = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris.`;

/**
 * These styles control font properties along with line- and letter-spacing,
 * but not block properties such as margins or spacing.
 */
const meta: Meta = {
  title: "Shared/Design System/Styles/Typography",
  // this hides the individual stories in the sidebar, showing only docs
  tags: ["!dev"],
  parameters: {
    docs: {
      // omit the Primary component and just show all stories
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

const StylesWrapper = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  column-gap: ${rem(spacing.lg)};
  row-gap: ${rem(spacing.lg)};
`;

function renderStyleGroup(prefix: string) {
  const levels = TYPOGRAPHY_LEVELS.filter((l) => l.startsWith(prefix));
  return (
    <StylesWrapper>
      {levels.map((level) => (
        <>
          <div css={typography.Sans14}>typography.{level}</div>
          <div css={typography[level]}>
            <div style={{ maxWidth: "50ch" }}>
              {level.startsWith("Body") ? longCopy : shortCopy}
            </div>
          </div>
        </>
      ))}
    </StylesWrapper>
  );
}

/**
 * For most UI elements, especially short pieces of copy
 */
export const Sans: StoryObj<typeof meta> = {
  render: () => renderStyleGroup("Sans"),
};

/**
 * For some more prominent UI elements
 */
export const Serif: StoryObj<typeof meta> = {
  render: () => renderStyleGroup("Serif"),
};

/**
 * For document headings; they have different spacing
 * that is optimized for readability in this context
 */
export const Header: StoryObj<typeof meta> = {
  render: () => renderStyleGroup("Header"),
};

/**
 * For paragraph and longer document copy; they have different spacing
 * that is optimized for readability in this context
 */
export const Body: StoryObj<typeof meta> = {
  render: () => renderStyleGroup("Body"),
};
