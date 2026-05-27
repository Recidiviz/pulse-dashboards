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
import styled from "styled-components";

import { palette } from "~design-system";

import {
  BottomPaddedContainer,
  FullBleedContainer,
  PageContainer,
  UnpaddedPageContainer,
} from "./BaseLayout";

// Colored placeholder blocks to make layout behavior visible
const Band = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color};
  padding: 16px;
  font-family: sans-serif;
  font-size: 13px;
  color: ${palette.pine1};
`;

const meta = {
  title: "Common UI/BaseLayout",
  component: PageContainer,
} satisfies Meta<typeof PageContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * PageContainer constrains content to a max width with horizontal padding.
 */
export const PageContainerStory: Story = {
  name: "PageContainer",
  render: () => (
    <PageContainer>
      <Band $color={palette.marble3}>
        This content is constrained to the max page width with horizontal
        padding applied on both sides.
      </Band>
    </PageContainer>
  ),
};

/**
 * FullBleedContainer breaks out of PageContainer's max width and padding to
 * fill the entire viewport width. Typically used for headers, footers, and
 * full-width colored sections.
 */
export const FullBleedContainerStory: Story = {
  name: "FullBleedContainer",
  render: () => (
    <PageContainer>
      <Band $color={palette.marble3}>Content inside PageContainer</Band>

      <FullBleedContainer>
        <Band $color={palette.pine3} style={{ color: palette.white }}>
          FullBleedContainer — spans the full viewport width
        </Band>
      </FullBleedContainer>

      <Band $color={palette.marble3}>Content inside PageContainer</Band>
    </PageContainer>
  ),
};

/**
 * UnpaddedPageContainer breaks out of PageContainer's left and right padding
 * without exceeding the max page width.
 */
export const UnpaddedPageContainerStory: Story = {
  name: "UnpaddedPageContainer",
  render: () => (
    <PageContainer>
      <Band $color={palette.marble3}>Content inside PageContainer</Band>

      <UnpaddedPageContainer>
        <Band $color={palette.slate20}>
          UnpaddedPageContainer — removes left/right padding but stays within
          max width
        </Band>
      </UnpaddedPageContainer>

      <Band $color={palette.marble3}>Content inside PageContainer</Band>
    </PageContainer>
  ),
};

/**
 * BottomPaddedContainer adds bottom margin, typically used to wrap a full page.
 */
export const BottomPaddedContainerStory: Story = {
  name: "BottomPaddedContainer",
  render: () => (
    <BottomPaddedContainer>
      <Band $color={palette.marble3}>
        This container adds bottom margin below its contents.
      </Band>
    </BottomPaddedContainer>
  ),
};
