// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Icon, Pill } from "@recidiviz/design-system";
import React, { ReactNode } from "react";
import {
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  AccordionItemState,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { Divider } from "./styles";

const CountPill = styled(Pill)`
  background-color: ${palette.slate10};
`;

const TaskListItemButton = styled(AccordionItemButton)`
  &:hover,
  :active {
    color: ${palette.pine1};

    ${CountPill} {
      color: ${palette.pine1};
      background-color: ${palette.slate20};
    }
  }
`;

const AlignedIcon = styled(Icon)<{
  $align: boolean;
}>`
  ${({ $align }) =>
    $align ? `vertical-align: middle;` : `vertical-align: baseline;`}
`;

type TaskListGroupProps<T = any> = {
  title: string;
  uuid: string;
  items: T[];
  renderer: (ele: T) => ReactNode;
};

export const TaskListGroup: React.FC<TaskListGroupProps> = ({
  title,
  uuid,
  items,
  renderer,
}) => {
  const { analyticsStore } = useRootStore();
  return (
    <AccordionItem
      uuid={uuid}
      onClick={() => analyticsStore.trackTaskHeaderToggled(title)}
    >
      <Divider />
      <AccordionItemHeading>
        <TaskListItemButton>
          <AccordionItemState>
            {({ expanded }) => (
              <AlignedIcon
                kind={"DownChevron"}
                size={12}
                rotate={expanded ? 0 : 270}
                $align={!!expanded}
              />
            )}
          </AccordionItemState>{" "}
          {title} <CountPill color={"white"}>{items.length}</CountPill>
        </TaskListItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        {items.map((item) => renderer(item))}
      </AccordionItemPanel>
    </AccordionItem>
  );
};
