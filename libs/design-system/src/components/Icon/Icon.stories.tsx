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

import { palette, typography } from "../../styles";
import { Icon, iconToDataURI } from "./Icon";
import { IconSVG } from "./IconSVG";

const iconKinds = Object.keys(IconSVG);

const meta: Meta<typeof Icon> = {
  title: "Shared/Design System/Components/Icon",
  component: Icon,
  argTypes: {
    color: {
      control: "color",
    },
    kind: {
      options: iconKinds,
      control: "select",
    },
    size: {
      control: { type: "text" },
    },
  },
  args: {
    color: palette.signal.links,
    kind: iconKinds[0],
    height: 32,
    width: 32,
    rotate: 0,
  },
};

export default meta;

type IconStory = StoryObj<typeof meta>;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  grid-auto-flow: row;
  grid-gap: 24px;
`;

const IconGridItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 72px;
`;

const IconKind = styled.div`
  ${typography.Sans14}

  color: ${palette.text.caption};
`;

export const AllIcons: IconStory = {
  render: ({ color, size, rotate }) => (
    <IconGrid>
      {iconKinds.map((kind) => (
        <IconGridItem key={kind}>
          <Icon kind={kind} color={color} size={size} rotate={rotate} />
          <IconKind>{kind}</IconKind>
        </IconGridItem>
      ))}
    </IconGrid>
  ),
  argTypes: {
    kind: { table: { disable: true } },
    width: { table: { disable: true } },
    height: { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    size: 32,
  },
};

export const AsComponent: IconStory = {};

const Input = styled.input`
  border: 1px solid black;
  color: ${palette.signal.links};
  font-weight: inherit;
  padding: 5px 9px 5px 1.5em;
  margin: -5px 0 0 -5px;
  width: 100%;
  min-width: 1px;

  text-overflow: ellipsis;
`;

/**
 * Use iconToDataURI to get a value suitable for CSS background images
 */
export const AsBackgroundImage: IconStory = {
  render: (args) => {
    return (
      <Input
        style={{
          backgroundImage: iconToDataURI(<Icon {...args} />),
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left 4px center",
          backgroundSize: "0.75em",
        }}
      />
    );
  },
};
