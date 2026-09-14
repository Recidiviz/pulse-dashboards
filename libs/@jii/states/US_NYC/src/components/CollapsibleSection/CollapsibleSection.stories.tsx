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
import { FC, ReactNode, UIEvent, useRef, useState } from "react";
import { fn } from "storybook/test";

import { HEADER_BORDER_WIDTH, HEADER_HEIGHT } from "~@jii/common-ui";
import { palette } from "~design-system";

import { CollapsibleSection } from "./CollapsibleSection";

const FILLER_PARAGRAPH =
  "The quick brown fox jumps over the lazy dog. This is placeholder content shown inside the section body.";

const SCROLL_CONTAINER_HEIGHT = 400;
// Matches AppLayout's Header transition (HEADER_ANIMATION_OPTIONS in ~@jii/common-ui).
const HEADER_TRANSITION = "transform 300ms ease-in-out";

/** Mirrors AppLayout's useScrollHide, scaled to this story's own scroll container instead of `window`. */
const HeaderHideDemo: FC<{ children: ReactNode }> = ({ children }) => {
  const lastScrollTop = useRef(0);
  const [hidden, setHidden] = useState(false);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop < SCROLL_CONTAINER_HEIGHT / 3) {
      setHidden(false);
    } else if (scrollTop > lastScrollTop.current) {
      setHidden(true);
    } else if (scrollTop < lastScrollTop.current) {
      setHidden(false);
    }
    lastScrollTop.current = scrollTop;
  };

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: SCROLL_CONTAINER_HEIGHT,
        overflowY: "auto",
        border: `1px solid ${palette.slate20}`,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          boxSizing: "content-box",
          height: HEADER_HEIGHT,
          borderBottom: `${HEADER_BORDER_WIDTH}px solid ${palette.slate20}`,
          background: palette.pine1,
          color: palette.white,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          transition: HEADER_TRANSITION,
          transform: hidden
            ? `translateY(-${HEADER_HEIGHT + HEADER_BORDER_WIDTH}px)`
            : "translateY(0)",
        }}
      >
        Navigation header (hides on scroll down)
      </div>
      <div style={{ padding: "0 16px" }}>{children}</div>
    </div>
  );
};

const meta = {
  title: "US_NYC/CollapsibleSection",
  component: CollapsibleSection,
  argTypes: {
    onToggle: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  args: {
    title: "Section heading",
    badgeLabel: "3",
    defaultOpen: false,
    stickyHeader: false,
    headerBorder: false,
    onToggle: fn(),
    children: <p>{FILLER_PARAGRAPH}</p>,
  },
} satisfies Meta<typeof CollapsibleSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Collapsed by default — the content is hidden until the header is clicked.
 */
export const Collapsed: Story = {};

/**
 * Expanded by default — the content is visible immediately.
 */
export const Expanded: Story = {
  args: {
    defaultOpen: true,
  },
};

/**
 * No badge label is passed — the badge is omitted from the header entirely.
 */
export const WithoutBadge: Story = {
  args: {
    defaultOpen: true,
    badgeLabel: undefined,
  },
};

/**
 * A border appears under the header while the section is open.
 */
export const WithHeaderBorder: Story = {
  args: {
    defaultOpen: true,
    headerBorder: true,
  },
};

/**
 * `stickyHeader` assumes a fixed app header of `HEADER_HEIGHT` sitting above it (see
 * `HIDDEN_HEADER_OFFSET` in `~@jii/common-ui`) - this story mocks that header and stacks two
 * long sections so the effect is visible. Scroll inside the box below: each section's
 * header pins just beneath the mock app header as its content scrolls past, then gives
 * way to the next section's header once that one reaches the same spot.
 */
export const StickyHeader: Story = {
  args: {
    defaultOpen: true,
    stickyHeader: true,
    headerBorder: true,
  },
  render: (args) => (
    <div
      style={{
        height: 400,
        overflowY: "auto",
        border: `1px solid ${palette.slate20}`,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          boxSizing: "content-box",
          height: HEADER_HEIGHT,
          borderBottom: `${HEADER_BORDER_WIDTH}px solid ${palette.slate20}`,
          background: palette.pine1,
          color: palette.white,
          display: "flex",
          alignItems: "center",
          padding: `0 ${16}px`,
        }}
      >
        Navigation header (fixed at HEADER_HEIGHT - {HEADER_HEIGHT}px)
      </div>
      <div style={{ padding: "0 16px" }}>
        <p>
          Scroll down to see the first section&apos;s header stick just below
          the mock app header above.
        </p>
        <CollapsibleSection {...args} title="First section">
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i}>{FILLER_PARAGRAPH}</p>
          ))}
        </CollapsibleSection>
        <CollapsibleSection
          stickyHeader
          headerBorder
          defaultOpen
          title="Second section"
          badgeLabel="2"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <p key={i}>{FILLER_PARAGRAPH}</p>
          ))}
        </CollapsibleSection>
      </div>
    </div>
  ),
};

/**
 * The real app header isn't always present - it hides on scroll (see AppLayout's
 * useScrollHide) by translating out of view rather than being removed from flow. Since
 * `stickyHeader` pins to a fixed offset regardless, once the real header slides away
 * there's nothing left to fill that space: scroll down past the hide threshold and the
 * section header stays pinned exactly where it was, leaving a gap above it the same
 * height as the now-hidden header.
 */
export const StickyHeaderWithHidingAppHeader: Story = {
  args: {
    defaultOpen: true,
    stickyHeader: true,
    headerBorder: true,
  },
  render: (args) => (
    <HeaderHideDemo>
      <p>
        Scroll down past the hide threshold, then back up, to see the navigation
        header hide and reappear.
      </p>
      <CollapsibleSection {...args} title="First section">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>{FILLER_PARAGRAPH}</p>
        ))}
      </CollapsibleSection>
      <CollapsibleSection
        stickyHeader
        headerBorder
        defaultOpen
        title="Second section"
        badgeLabel="2"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <p key={i}>{FILLER_PARAGRAPH}</p>
        ))}
      </CollapsibleSection>
    </HeaderHideDemo>
  ),
};
