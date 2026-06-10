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

import { palette, spacing } from "../";

interface SwatchProps {
  color: string;
  name: string;
}

interface SwatchPreviewProps {
  color: string;
}

const SwatchContainer = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  margin-bottom: ${rem(spacing.xxs)};
  font-size: ${rem("13px")};
  letter-spacing: -1%;
`;

const SwatchPreview = styled.div<SwatchPreviewProps>`
  background-color: ${(props) => props.color};
  border-radius: 3px;
  height: 48px;
  width: 48px;
  margin-right: ${rem(spacing.sm)};
`;

const SwatchName = styled.div`
  font-weight: bold;
`;

const SwatchCode = styled.div`
  font-size: 0.9em;
  color: ${palette.text.caption};
`;

interface SwatchGridProps {
  dark?: boolean;
}

const SwatchGrid = styled.div<SwatchGridProps>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 16px;
  grid-row-gap: 16px;
  margin-bottom: 32px;

  ${(props) =>
    props.dark
      ? `
    background: ${palette.slate};
    padding: ${rem(spacing.sm)};
    & * {color: ${palette.white};}`
      : ""}
`;

const Swatch = ({ name, color }: SwatchProps) => (
  <SwatchContainer>
    <SwatchPreview color={color} />
    <div>
      <SwatchName>{name}</SwatchName>
      <SwatchCode>{color}</SwatchCode>
    </div>
  </SwatchContainer>
);

type FlattenedPalette = Record<string, Record<string, string>>;

/**
 * Flattens the nested palette object into key/value pairs
 * that we can iterate over to display their swatches
 */
function flattenPaletteRecursive(
  obj: Record<string, unknown> = palette,
  result: FlattenedPalette = {},
  label = "palette",
): FlattenedPalette {
  for (const [key, value] of Object.entries(obj)) {
    // strings are assumed to be colors
    if (typeof value === "string") {
      (result[label] ??= {})[key] = value;
    } else if (
      // nested objects are recursed into,
      // other properties such as ordering arrays are just ignored
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      flattenPaletteRecursive(
        value as Record<string, unknown>,
        result,
        // labels nested objects with their full path
        `${label}.${key}`,
      );
    }
  }
  return result;
}

/**
 * the top-level palette can be divided into a number of logical groups
 * that aren't actually nested but are useful to separate out for documentation.
 * This function does that with a catchall "other" group for anything it doesn't match,
 * so that we don't inadvertently drop any colors as the palette changes over time
 */
function splitPaletteGroups() {
  const subsetPrefixes = ["marble", "pine", "slate", "pink", "white"] as const;
  const groups: FlattenedPalette = {
    ...Object.fromEntries(subsetPrefixes.map((k) => [k, {}])),
    other: {},
  };
  const { palette: topLevel = {}, ...rest } = flattenPaletteRecursive();

  for (const [key, value] of Object.entries(topLevel)) {
    const prefix = subsetPrefixes.find((p) => key.startsWith(p));
    const groupKey = prefix ?? "other";
    groups[groupKey][key] = value;
  }

  return { groups, rest };
}

const { groups, rest } = splitPaletteGroups();

function renderGroup(label: string, colors: Record<string, string>) {
  // nested groups already carry the full path (e.g. "palette.signal");
  // subset-prefix groups are top-level keys so their parent is just "palette"
  const pathPrefix = label.startsWith("palette.") ? label : "palette";
  return (
    <SwatchGrid dark={label === "white"}>
      {Object.entries(colors).map(([token, value]) => (
        <Swatch key={token} name={`${pathPrefix}.${token}`} color={value} />
      ))}
    </SwatchGrid>
  );
}

const meta = {
  title: "Shared/Design System/Styles/Palette",
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
} satisfies Meta;

export default meta;

type PaletteStory = StoryObj<typeof meta>;

/** Used mainly for backgrounds and for knockout elements */
export const Marble: PaletteStory = {
  render: () => renderGroup("marble", groups["marble"]),
};

/** Used mainly for UI elements such as text or dark backgrounds */
export const Pine: PaletteStory = {
  render: () => renderGroup("pine", groups["pine"]),
};

/** Used mainly for UI elements such as text, icons, and borders */
export const Slate: PaletteStory = {
  render: () => renderGroup("slate", groups["slate"]),
};

/** Used mainly for status pills */
export const Pink: PaletteStory = {
  render: () => renderGroup("pink", groups["pink"]),
};

export const White: PaletteStory = {
  render: () => renderGroup("white", groups["white"]),
};

export const Other: PaletteStory = {
  render: () => renderGroup("other", groups["other"]),
};

// nested groups

/** Used mainly for system alerts, error states, links, tooltips, and highlights */
export const Signal: PaletteStory = {
  render: () => renderGroup("palette.signal", rest["palette.signal"]),
};

/** Used mainly for data visualizations */
export const Data: PaletteStory = {
  render: () => renderGroup("palette.data", rest["palette.data"]),
};

export const Text: PaletteStory = {
  render: () => renderGroup("palette.text", rest["palette.text"]),
};
